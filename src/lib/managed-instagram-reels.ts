import crypto from "crypto";
import type { InstagramReel } from "@/lib/instagram-reels";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";

export const INSTAGRAM_REELS_TABLE = "instagram_reels";
export const INSTAGRAM_REEL_THUMBNAILS_BUCKET = "instagram-reel-thumbnails";
const MAX_REELS = 12;
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
const INSTAGRAM_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const INSTAGRAM_CRAWLER_USER_AGENT =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

const DEFAULT_REEL_LINKS = [
  "https://www.instagram.com/reel/DV3fc6_Tqcc/?utm_source=ig_web_button_share_sheet&igsh=MzRlODBiNWFlZA==",
];

export interface ManagedInstagramReels {
  reels: string[];
}

function isInstagramReelUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host === "instagram.com" || host === "www.instagram.com") &&
      url.pathname.startsWith("/reel/")
    );
  } catch {
    return false;
  }
}

export function normalizeManagedInstagramReels(raw: unknown): ManagedInstagramReels {
  const values = Array.isArray((raw as ManagedInstagramReels | null)?.reels)
    ? (raw as ManagedInstagramReels).reels
    : DEFAULT_REEL_LINKS;
  const seen = new Set<string>();
  const reels = values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => isInstagramReelUrl(value) && !seen.has(value) && Boolean(seen.add(value)))
    .slice(0, MAX_REELS);
  return { reels };
}

export function validateManagedInstagramReels(raw: unknown): ManagedInstagramReels | null {
  if (!Array.isArray((raw as ManagedInstagramReels | null)?.reels)) return null;
  const input = (raw as ManagedInstagramReels).reels;
  if (input.length > MAX_REELS || input.some((value) => typeof value !== "string" || !isInstagramReelUrl(value.trim()))) {
    return null;
  }
  return normalizeManagedInstagramReels(raw);
}

export type StoredReel = {
  id: string;
  url: string;
  thumbnail_url: string | null;
  thumbnail_path: string | null;
  caption: string | null;
};

export type StoredReelRow = StoredReel & {
  position: number;
  active: boolean;
};

export function formatInstagramReelsSetupError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("permission denied")) {
    return "Database permissions are missing for Instagram reels. Run supabase/migrations/20260719000001_grant_instagram_reels.sql in your Supabase SQL editor, then try again.";
  }
  if (
    normalized.includes("does not exist") ||
    normalized.includes("schema cache") ||
    normalized.includes("could not find the table")
  ) {
    return "Instagram reels storage is not set up yet. Run supabase/migrations/20260719000000_create_instagram_reels.sql in your Supabase SQL editor, then try again.";
  }
  if (normalized.includes("bucket") && normalized.includes("not found")) {
    return "The instagram-reel-thumbnails storage bucket is missing. Run supabase/migrations/20260719000000_create_instagram_reels.sql in your Supabase SQL editor, then try again.";
  }
  return message;
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!items.length) return [];

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) return;
      results[current] = await mapper(items[current], current);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

export async function getManagedInstagramReelLinks(): Promise<ManagedInstagramReels> {
  if (!isConfigured) return { reels: DEFAULT_REEL_LINKS };
  try {
    const { data } = await supabaseAdmin
      .from(INSTAGRAM_REELS_TABLE)
      .select("id, url, thumbnail_url, thumbnail_path")
      .eq("active", true)
      .order("position", { ascending: true });
    return data
      ? normalizeManagedInstagramReels({ reels: (data as StoredReel[]).map((reel) => reel.url) })
      : { reels: DEFAULT_REEL_LINKS };
  } catch {
    return { reels: DEFAULT_REEL_LINKS };
  }
}

function metaContent(html: string, property: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const propertyMatch = tag.match(/(?:property|name)=["']([^"']+)["']/i);
    if (propertyMatch?.[1]?.toLowerCase() !== property) continue;
    const contentMatch = tag.match(/content=["']([^"']+)["']/i);
    if (contentMatch?.[1]) return contentMatch[1].replace(/&amp;/g, "&");
  }
  return "";
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanInstagramCaption(title: string) {
  return decodeHtmlEntities(title)
    .replace(/^Instagram:\s*["']?/i, "")
    .replace(/ on Instagram:.*$/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

async function fetchInstagramReelOembed(link: string) {
  const response = await fetch(
    `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(link)}`,
    {
      headers: {
        "User-Agent": INSTAGRAM_USER_AGENT,
        Accept: "application/json",
      },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    },
  );
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("json")) return null;

  const data = (await response.json()) as { thumbnail_url?: string; title?: string };
  if (!data.thumbnail_url) return null;

  return {
    sourceThumbnail: data.thumbnail_url,
    caption: cleanInstagramCaption(data.title ?? ""),
  };
}

async function fetchInstagramReelOpenGraph(link: string) {
  const response = await fetch(link, {
    headers: {
      "User-Agent": INSTAGRAM_CRAWLER_USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return null;

  const html = await response.text();
  const sourceThumbnail = metaContent(html, "og:image");
  if (!sourceThumbnail) return null;

  return {
    sourceThumbnail,
    caption: cleanInstagramCaption(metaContent(html, "og:title")),
  };
}

export async function fetchInstagramReelMetadata(link: string) {
  try {
    return (await fetchInstagramReelOembed(link)) ?? (await fetchInstagramReelOpenGraph(link));
  } catch {
    return null;
  }
}

async function downloadInstagramReelThumbnail(sourceThumbnail: string, reelUrl: string) {
  const image = await fetch(sourceThumbnail, {
    headers: {
      "User-Agent": INSTAGRAM_USER_AGENT,
      Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      Referer: reelUrl,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  const contentType = image.headers.get("content-type") ?? "";
  if (!image.ok || !contentType.startsWith("image/")) {
    return null;
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  if (buffer.byteLength > MAX_THUMBNAIL_BYTES) {
    return null;
  }

  const extension = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";

  return { buffer, contentType, extension };
}

export type ProcessedInstagramReel =
  | { url: string; error: string }
  | { url: string; row: StoredReel };

/** Fetch a reel cover image from Instagram and store it in Supabase Storage. */
export async function storeInstagramReelThumbnail(url: string): Promise<ProcessedInstagramReel> {
  try {
    const metadata = await fetchInstagramReelMetadata(url);
    if (!metadata) {
      return { url, error: `Could not fetch the thumbnail for ${url}` };
    }

    const image = await downloadInstagramReelThumbnail(metadata.sourceThumbnail, url);
    if (!image) {
      return { url, error: `Could not download the thumbnail for ${url}` };
    }

    const id = crypto.randomUUID();
    const path = `reels/${id}.${image.extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(INSTAGRAM_REEL_THUMBNAILS_BUCKET)
      .upload(path, image.buffer, { contentType: image.contentType, upsert: false });

    if (uploadError) {
      return { url, error: formatInstagramReelsSetupError(uploadError.message) };
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from(INSTAGRAM_REEL_THUMBNAILS_BUCKET)
      .getPublicUrl(path);

    return {
      url,
      row: {
        id,
        url,
        thumbnail_url: publicUrl.publicUrl,
        thumbnail_path: path,
        caption: metadata.caption || null,
      },
    };
  } catch (error) {
    return {
      url,
      error: error instanceof Error ? error.message : `Could not save the thumbnail for ${url}`,
    };
  }
}

export function buildInstagramReelUpsertRows(
  urls: string[],
  existingByUrl: Map<string, StoredReel>,
  freshByUrl: Map<string, StoredReel>,
  captionByUrl: Map<string, string> = new Map(),
): StoredReelRow[] {
  return urls.map((url, position) => {
    const existing = existingByUrl.get(url);
    const fresh = freshByUrl.get(url);
    const caption =
      fresh?.caption ??
      captionByUrl.get(url) ??
      existing?.caption ??
      null;

    if (existing?.thumbnail_path && existing.thumbnail_url) {
      return {
        id: existing.id,
        url,
        thumbnail_url: existing.thumbnail_url,
        thumbnail_path: existing.thumbnail_path,
        caption,
        position,
        active: true,
      };
    }

    if (fresh?.thumbnail_path && fresh.thumbnail_url) {
      return {
        id: fresh.id,
        url,
        thumbnail_url: fresh.thumbnail_url,
        thumbnail_path: fresh.thumbnail_path,
        caption,
        position,
        active: true,
      };
    }

    throw new Error(`Missing stored thumbnail for ${url}`);
  });
}

/** Fetch the current cover image for each admin-managed public reel URL. */
export async function getManagedInstagramReels(): Promise<InstagramReel[]> {
  if (!isConfigured) return [];
  try {
    const { data } = await supabaseAdmin
      .from(INSTAGRAM_REELS_TABLE)
      .select("id, url, thumbnail_url, caption")
      .eq("active", true)
      .not("thumbnail_url", "is", null)
      .order("position", { ascending: true });
    return ((data ?? []) as Array<Pick<StoredReel, "id" | "url" | "thumbnail_url" | "caption">>)
      .filter((reel) => Boolean(reel.thumbnail_url))
      .map((reel) => ({
        id: reel.id,
        link: reel.url,
        thumbnail: reel.thumbnail_url!,
        caption: reel.caption ?? "",
        likes: "",
        views: "",
      }));
  } catch {
    return [];
  }
}
