import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireRole } from "@/lib/server/auth";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import {
  INSTAGRAM_REELS_TABLE,
  fetchInstagramReelMetadata,
  validateManagedInstagramReels,
} from "@/lib/managed-instagram-reels";

export async function PUT(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }

  const reels = validateManagedInstagramReels(await req.json());
  if (!reels) {
    return NextResponse.json({ error: "Add up to 12 valid https://www.instagram.com/reel/... links." }, { status: 400 });
  }

  if (!isConfigured) return NextResponse.json(reels);

  const { data: existing, error: existingError } = await supabaseAdmin
    .from(INSTAGRAM_REELS_TABLE)
    .select("id, url, thumbnail_path");
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const existingByUrl = new Map((existing ?? []).map((reel) => [reel.url as string, reel]));
  const newUrls = reels.reels.filter((url) => !existingByUrl.get(url)?.thumbnail_path);

  async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
      while (true) {
        const current = nextIndex++;
        if (current >= items.length) return;
        results[current] = await mapper(items[current], current);
      }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
  }

  const MAX_CONCURRENCY = 3;
  let newRows: Array<{ id: string; url: string; thumbnail_url: string; thumbnail_path: string }> = [];

  const reelTasks = newUrls.map(async (url) => {
    const metadata = await fetchInstagramReelMetadata(url);
    if (!metadata) {
      return { url, error: `Could not fetch the thumbnail for ${url}` as const };
    }

    const image = await fetch(metadata.sourceThumbnail);
    const contentType = image.headers.get("content-type") ?? "";
    if (!image.ok || !contentType.startsWith("image/")) {
      return { url, error: `Could not download the thumbnail for ${url}` as const };
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    if (buffer.byteLength > 5 * 1024 * 1024) {
      return { url, error: "A reel thumbnail is too large." as const };
    }

    const id = crypto.randomUUID();
    const extension = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const path = `reels/${id}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("instagram-reel-thumbnails")
      .upload(path, buffer, { contentType, upsert: false });

    if (uploadError) {
      return { url, error: uploadError.message };
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from("instagram-reel-thumbnails")
      .getPublicUrl(path);

    return {
      url,
      row: {
        id,
        url,
        thumbnail_url: publicUrl.publicUrl,
        thumbnail_path: path,
      },
    };
  });

  // Run tasks with concurrency limit, but do not fail whole request on one bad URL.
  const processed = await mapWithConcurrency(reelTasks, MAX_CONCURRENCY, (task) => task);

  type ProcessedTask =
    | { url: string; error: string }
    | { url: string; row: { id: string; url: string; thumbnail_url: string; thumbnail_path: string } };

  const typedProcessed = processed as ProcessedTask[];
  const failures = typedProcessed.filter((r) => "error" in r);
  const successes = typedProcessed.filter((r) => "row" in r).map((r) => r.row);

  if (failures.length) {
    // If everything fails, keep existing behavior (422). If partially fails, still upsert successes.
    if (successes.length === 0) {
      return NextResponse.json({ error: failures[0].error }, { status: 422 });
    }

    // Optional: still return 200 with success, but include error details.
    // Since the endpoint contract likely expects JSON of reels, we keep status 200
    // and just proceed.
  }

  newRows = successes;

  if (reels.reels.length) {
    const { error: saveError } = await supabaseAdmin
      .from(INSTAGRAM_REELS_TABLE)
      .upsert(
        reels.reels.map((url, position) => ({
          ...(existingByUrl.get(url)?.thumbnail_path
            ? existingByUrl.get(url)
            : newRows.find((row) => row.url === url)),
          url,
          position,
          active: true,
        })),
        { onConflict: "url" },
      );
    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  const removed = (existing ?? []).filter((reel) => !reels.reels.includes(reel.url as string));
  if (removed.length) {
    const paths = removed.map((reel) => reel.thumbnail_path as string).filter(Boolean);
    if (paths.length) {
      const { error: storageError } = await supabaseAdmin.storage.from("instagram-reel-thumbnails").remove(paths);
      if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });
    }
    const { error: deleteError } = await supabaseAdmin
      .from(INSTAGRAM_REELS_TABLE)
      .delete()
      .in("url", removed.map((reel) => reel.url as string));
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }
  return NextResponse.json(reels);
}
