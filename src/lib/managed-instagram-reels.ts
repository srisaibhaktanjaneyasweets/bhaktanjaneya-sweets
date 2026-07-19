import type { InstagramReel } from "@/lib/instagram-reels";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";

export const INSTAGRAM_REELS_TABLE = "instagram_reels";
const MAX_REELS = 12;

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

type StoredReel = { id: string; url: string; thumbnail_url: string | null; thumbnail_path: string | null };

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

export async function fetchInstagramReelMetadata(link: string) {
  try {
    const response = await fetch(link, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BhaktanjaneyaSweets/1.0)" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    const sourceThumbnail = metaContent(html, "og:image");
    if (!sourceThumbnail) return null;
    const title = metaContent(html, "og:title")
      .replace(/^Instagram:\s*["']?/, "")
      .replace(/["']$/, "");
    return { sourceThumbnail, caption: title };
  } catch {
    return null;
  }
}

/** Fetch the current cover image for each admin-managed public reel URL. */
export async function getManagedInstagramReels(): Promise<InstagramReel[]> {
  if (!isConfigured) return [];
  try {
    const { data } = await supabaseAdmin
      .from(INSTAGRAM_REELS_TABLE)
      .select("id, url, thumbnail_url")
      .eq("active", true)
      .not("thumbnail_url", "is", null)
      .order("position", { ascending: true });
    return ((data ?? []) as Array<Pick<StoredReel, "id" | "url" | "thumbnail_url">>)
      .filter((reel) => Boolean(reel.thumbnail_url))
      .map((reel) => ({
        id: reel.id,
        link: reel.url,
        thumbnail: reel.thumbnail_url!,
        caption: "",
        likes: "",
        views: "",
      }));
  } catch {
    return [];
  }
}
