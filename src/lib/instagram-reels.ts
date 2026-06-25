export interface InstagramReel {
  id: string;
  thumbnail: string;
  caption: string;
  likes: string;
  views: string;
  link: string;
  duration?: string;
  videoUrl?: string;
}

export const instagramReels: InstagramReel[] = [
  {
    id: "reel-1",
    thumbnail: "/images/tapeswaram_kaja_reel.png",
    caption: "Preparing the iconic Tapeswaram Kaja in pure ghee. The secret is in our traditional layers! ✨ #TapeswaramKaja #PureGheeSweets #AndhraSweets",
    likes: "2.4k",
    views: "28.5k",
    link: "https://www.instagram.com/bhaktanjaneyasweets.in/reels/",
    duration: "00:35",
    videoUrl: "https://player.vimeo.com/external/435674703.sd.mp4?s=7fdf27e2213e4b77f98c8d8b671a53c9e6d0a7a0&profile_id=165&oauth2_token_id=57447761",
  },
  {
    id: "reel-2",
    thumbnail: "/images/madatha_kaja_reel.png",
    caption: "Behind the scenes: Crafting our famous syrupy Madatha Kaja. Every bite is pure bliss! 🍯💫 #MadathaKaja #SweetMakers #AndhraFoodie",
    likes: "4.1k",
    views: "42.9k",
    link: "https://www.instagram.com/bhaktanjaneyasweets.in/reels/",
    duration: "00:39",
    videoUrl: "https://player.vimeo.com/external/384761655.sd.mp4?s=38dbbb615015b6510f22d64a27546522c0627d7e&profile_id=165&oauth2_token_id=57447761",
  },
  {
    id: "reel-3",
    thumbnail: "/images/special_mixture_reel.png",
    caption: "Our crunchy, spicy Special Mixture being made fresh today! Perfect snack for your evening chai ☕️ #IndianSnacks #TeaTime #RajahmundryFood",
    likes: "1.8k",
    views: "18.2k",
    link: "https://www.instagram.com/bhaktanjaneyasweets.in/reels/",
    duration: "00:38",
    videoUrl: "https://player.vimeo.com/external/459389137.sd.mp4?s=872719d3fbd20078b53051493026f8bf962d3a2c&profile_id=165&oauth2_token_id=57447761",
  },
  {
    id: "reel-4",
    thumbnail: "/images/ghee_ladoo_reel.png",
    caption: "Mouth-watering Ladoos made with premium nuts and pure buffalo ghee. Taste the tradition! 🥥🍯 #GheeSweets #TraditionOfTaste #FestivalSweets",
    likes: "3.2k",
    views: "35.1k",
    link: "https://www.instagram.com/bhaktanjaneyasweets.in/reels/",
    duration: "00:46",
    videoUrl: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c02271881e59db10472b101684c3c3a9&profile_id=139&oauth2_token_id=57447761",
  },
];

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
      return {
        id: String(item.id || item.url || caption),
        thumbnail,
        caption,
        likes: "",
        views: "",
        link: str(item.url) || REELS_FALLBACK_LINK,
      };
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

      return {
        id: guid || link || caption,
        thumbnail,
        caption,
        likes: "",
        views: "",
        link: link || REELS_FALLBACK_LINK,
      };
    })
    .filter((r) => r.thumbnail);
}

export async function getRssReels(): Promise<InstagramReel[] | null> {
  const feedUrl = process.env.INSTAGRAM_RSS_URL;
  if (!feedUrl) return null;

  try {
    const res = await fetch(feedUrl, { cache: "no-store" });
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
 * then the official Instagram Graph API, then local hand-curated covers.
 */
export async function getLiveInstagramReels() {
  const rss = await getRssReels();
  if (rss) return rss;

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return instagramReels;
  }

  try {
    const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=12&access_token=${token}`;
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache Instagram reels server-side for 1 hour
    });
    
    const data = (await res.json()) as { data?: Array<Record<string, unknown>> };
    if (!data.data) {
      console.warn("Instagram API returned no media data:", data);
      return instagramReels;
    }

    const str = (v: unknown) => (typeof v === "string" ? v : "");

    // Filter to only show video/reel posts and map them
    const mappedReels = data.data
      .filter(
        (item) =>
          item.media_type === "VIDEO" || item.media_type === "CAROUSEL_ALBUM",
      )
      .map((item) => ({
        id: str(item.id),
        thumbnail: str(item.thumbnail_url) || str(item.media_url),
        caption: str(item.caption),
        likes: "", // Basic Display API doesn't return like/view counts
        views: "",
        link: str(item.permalink),
      }));

    return mappedReels.length ? mappedReels : instagramReels;
  } catch (error) {
    console.error("Error fetching Instagram reels:", error);
    return instagramReels;
  }
}



