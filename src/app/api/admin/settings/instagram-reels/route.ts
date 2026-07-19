import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import {
  INSTAGRAM_REELS_TABLE,
  INSTAGRAM_REEL_THUMBNAILS_BUCKET,
  buildInstagramReelUpsertRows,
  fetchInstagramReelMetadata,
  formatInstagramReelsSetupError,
  mapWithConcurrency,
  storeInstagramReelThumbnail,
  type StoredReel,
  validateManagedInstagramReels,
} from "@/lib/managed-instagram-reels";

const MAX_CONCURRENCY = 3;

export async function GET(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  if (!isConfigured) return NextResponse.json({ reels: [] });

  try {
    const { data, error } = await supabaseAdmin
      .from(INSTAGRAM_REELS_TABLE)
      .select("id, url, thumbnail_url, caption, position")
      .eq("active", true)
      .order("position", { ascending: true });

    if (error) {
      return NextResponse.json({ error: formatInstagramReelsSetupError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ reels: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load reels" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const reels = validateManagedInstagramReels(body);
  if (!reels) {
    return NextResponse.json(
      { error: "Add up to 12 valid https://www.instagram.com/reel/... links." },
      { status: 400 },
    );
  }

  if (!isConfigured) return NextResponse.json(reels);

  try {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from(INSTAGRAM_REELS_TABLE)
      .select("id, url, thumbnail_url, thumbnail_path, caption");
    if (existingError) {
      return NextResponse.json(
        { error: formatInstagramReelsSetupError(existingError.message) },
        { status: 500 },
      );
    }

    const existingByUrl = new Map(
      (existing ?? []).map((reel) => [reel.url as string, reel as StoredReel]),
    );
    const newUrls = reels.reels.filter((url) => {
      const stored = existingByUrl.get(url);
      return !stored?.thumbnail_path || !stored.thumbnail_url;
    });

    const processed = await mapWithConcurrency(newUrls, MAX_CONCURRENCY, (url) =>
      storeInstagramReelThumbnail(url),
    );

    const failures = processed.filter((result) => "error" in result);
    if (failures.length) {
      return NextResponse.json({ error: failures[0].error }, { status: 422 });
    }

    const freshByUrl = new Map(
      processed
        .filter((result): result is Extract<typeof result, { row: StoredReel }> => "row" in result)
        .map((result) => [result.url, result.row]),
    );

    const captionOnlyUrls = reels.reels.filter((url) => {
      const stored = existingByUrl.get(url);
      return stored?.thumbnail_path && stored.thumbnail_url && !stored.caption;
    });

    const captionResults = await mapWithConcurrency(captionOnlyUrls, MAX_CONCURRENCY, async (url) => {
      const metadata = await fetchInstagramReelMetadata(url);
      return { url, caption: metadata?.caption ?? "" };
    });

    const captionByUrl = new Map(
      captionResults.filter((result) => result.caption).map((result) => [result.url, result.caption]),
    );

    if (reels.reels.length) {
      let rows;
      try {
        rows = buildInstagramReelUpsertRows(reels.reels, existingByUrl, freshByUrl, captionByUrl);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Could not prepare reel rows." },
          { status: 422 },
        );
      }

      const { error: saveError } = await supabaseAdmin
        .from(INSTAGRAM_REELS_TABLE)
        .upsert(rows, { onConflict: "url" });
      if (saveError) {
        return NextResponse.json(
          { error: formatInstagramReelsSetupError(saveError.message) },
          { status: 500 },
        );
      }
    }

    const removed = (existing ?? []).filter((reel) => !reels.reels.includes(reel.url as string));
    if (removed.length) {
      const paths = removed.map((reel) => reel.thumbnail_path as string).filter(Boolean);
      if (paths.length) {
        const { error: storageError } = await supabaseAdmin.storage
          .from(INSTAGRAM_REEL_THUMBNAILS_BUCKET)
          .remove(paths);
        if (storageError) {
          return NextResponse.json(
            { error: formatInstagramReelsSetupError(storageError.message) },
            { status: 500 },
          );
        }
      }

      const { error: deleteError } = await supabaseAdmin
        .from(INSTAGRAM_REELS_TABLE)
        .delete()
        .in(
          "url",
          removed.map((reel) => reel.url as string),
        );
      if (deleteError) {
        return NextResponse.json(
          { error: formatInstagramReelsSetupError(deleteError.message) },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(reels);
  } catch (error) {
    console.error("Failed to save Instagram reels:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save Instagram reels." },
      { status: 500 },
    );
  }
}
