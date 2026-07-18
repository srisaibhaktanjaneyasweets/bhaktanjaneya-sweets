export interface InstagramReel {
  id: string;
  thumbnail: string;
  /** Original upstream thumbnail, used to retry a freshly signed CDN URL. */
  sourceThumbnail?: string;
  caption: string;
  likes: string;
  views: string;
  link: string;
  duration?: string;
}

/**
 * Fetches reels from a public RSS/JSON feed (e.g. an RSS.app feed generated from
 * the public Instagram profile URL — no Instagram account/login required).
 * Returns null if not configured or the request fails, so the caller can fall back.
 */
const REELS_FALLBACK_LINK = "https://www.instagram.com/bhaktanjaneyasweets.in/reels/";

/** Decode the handful of XML entities that appear in feed URLs/text. */
function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripCdata(value: string): string {
  return value.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim();
}

/**
 * Route a remote Instagram/Facebook CDN thumbnail through our same-origin proxy
 * so the browser doesn't block it with Cross-Origin-Resource-Policy. Local paths
 * and non-CDN URLs pass through unchanged. See /api/ig-image.
 */
export function proxyInstagramImage(url: string): string {
  if (!url || url.startsWith("/")) return url;
  try {
    const host = new URL(url).hostname;
    if (host.endsWith(".cdninstagram.com") || host.endsWith(".fbcdn.net")) {
      return `/api/ig-image?url=${encodeURIComponent(url)}`;
    }
  } catch {
    return url;
  }
  return url;
}

function reelWithThumbnail(
  data: Omit<InstagramReel, "thumbnail" | "sourceThumbnail">,
  thumbnail: string,
): InstagramReel {
  const sourceThumbnail = thumbnail.trim();
  return {
    ...data,
    thumbnail: proxyInstagramImage(sourceThumbnail),
    sourceThumbnail,
  };
}

/** Parse an rss.app JSON Feed (the /v1.1/…json variant). */
function parseJsonReels(body: string): InstagramReel[] {
  let data: { items?: Array<Record<string, unknown>> };
  try {
    data = JSON.parse(body);
  } catch {
    return [];
  }
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return (data?.items ?? [])
    .map((item) => {
      const caption = str(item.title || item.content_text || item.content_html)
        .replace(/<[^>]*>/g, "")
        .trim();
      const attachments = item.attachments as Array<{ url?: string }> | undefined;
      const thumbnail =
        str(item.image) || str(item.banner_image) || str(attachments?.[0]?.url);
      return reelWithThumbnail({
        id: String(item.id || item.url || caption),
        caption,
        likes: "",
        views: "",
        link: str(item.url) || REELS_FALLBACK_LINK,
      }, thumbnail);
    })
    .filter((r) => r.thumbnail);
}

/** Parse an RSS 2.0 XML feed (the rss.app …xml variant). */
function parseXmlReels(body: string): InstagramReel[] {
  const items = body.match(/<item\b[\s\S]*?<\/item>/g) ?? [];
  return items
    .map((block) => {
      const pick = (re: RegExp) => block.match(re)?.[1] ?? "";
      const caption = stripCdata(pick(/<title>([\s\S]*?)<\/title>/))
        .replace(/<[^>]*>/g, "")
        .trim();
      const link = stripCdata(pick(/<link>([\s\S]*?)<\/link>/)).trim();
      const guid = stripCdata(pick(/<guid[^>]*>([\s\S]*?)<\/guid>/)).trim();

      // Prefer the media:content cover; fall back to the first <img> in the body.
      let thumbnail = block.match(/<media:content[^>]*\burl="([^"]+)"/)?.[1] ?? "";
      if (!thumbnail) {
        const description = stripCdata(pick(/<description>([\s\S]*?)<\/description>/));
        thumbnail = description.match(/<img[^>]*\bsrc="([^"]+)"/)?.[1] ?? "";
      }
      thumbnail = decodeXmlEntities(thumbnail).trim();

      return reelWithThumbnail({
        id: guid || link || caption,
        caption,
        likes: "",
        views: "",
        link: link || REELS_FALLBACK_LINK,
      }, thumbnail);
    })
    .filter((r) => r.thumbnail);
}

export async function getRssReels(): Promise<InstagramReel[] | null> {
  const feedUrl = process.env.INSTAGRAM_RSS_URL;
  if (!feedUrl) return null;

  try {
    // Cache the feed for 30 min and cap at 4s so a slow rss.app/Instagram CDN
    // can't block the home page render on every visit.
    const res = await fetch(feedUrl, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(4000),
    });
    const contentType = res.headers.get("content-type") ?? "";
    const body = await res.text();

    // The feed can be JSON (/v1.1/…json) or RSS XML (…xml) — detect and parse.
    const looksJson = contentType.includes("json") || /^\s*[[{]/.test(body);
    const reels = looksJson ? parseJsonReels(body) : parseXmlReels(body);

    return reels.length ? reels : null;
  } catch (error) {
    console.error("Error fetching Instagram RSS feed:", error);
    return null;
  }
}

/**
 * Live reels for the homepage. Prefers the public RSS feed (no account needed),
 * then the official Instagram Graph API. Returns an empty list when nothing is
 * configured so the section hides itself instead of showing placeholder content.
 */
export async function getLiveInstagramReels(): Promise<InstagramReel[]> {
  const rss = await getRssReels();
  if (rss) return rss;

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return [];

  try {
    const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=12&access_token=${token}`;
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache Instagram reels server-side for 1 hour
      signal: AbortSignal.timeout(4000),
    });

    const data = (await res.json()) as { data?: Array<Record<string, unknown>> };
    if (!data.data) {
      console.warn("Instagram API returned no media data:", data);
      return [];
    }

    const str = (v: unknown) => (typeof v === "string" ? v : "");

    // Filter to only show video/reel posts and map them
    return data.data
      .filter(
        (item) =>
          item.media_type === "VIDEO" || item.media_type === "CAROUSEL_ALBUM",
      )
      .map((item) => reelWithThumbnail({
        id: str(item.id),
        caption: str(item.caption),
        likes: "", // Basic Display API doesn't return like/view counts
        views: "",
        link: str(item.permalink),
      }, str(item.thumbnail_url) || str(item.media_url)));
  } catch (error) {
    console.error("Error fetching Instagram reels:", error);
    return [];
  }
}



