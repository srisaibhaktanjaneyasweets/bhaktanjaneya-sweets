// ─────────────────────────────────────────────────────────────────────────────
//  GOOGLE REVIEWS  —  EDIT THIS FILE TO SHOW REAL REVIEWS
// ─────────────────────────────────────────────────────────────────────────────
//  These power the "Loved on Google" section on the homepage. They are CURRENTLY
//  PLACEHOLDERS. To go live with real reviews:
//
//   1. Open your Google Business Profile / Google Maps listing.
//   2. Copy 3–5 genuine reviews (reviewer name, star rating, the text, and when
//      it was posted) into the `googleReviews` array below.
//   3. Set the "Read all reviews on Google" link by either:
//        • setting NEXT_PUBLIC_GOOGLE_REVIEWS_URL in your environment, or
//        • editing `googleReviewsUrl` in src/lib/config.ts.
//   4. (Optional) Update `googleRatingSummary` with your real average + count.
//
//  Nothing here is fetched from Google automatically — it is hand-curated so the
//  homepage is always fast and you control exactly which reviews appear.
// ─────────────────────────────────────────────────────────────────────────────

export interface GoogleReview {
  /** Reviewer's display name as shown on Google. */
  author: string;
  /** Star rating they gave, 1–5. */
  rating: number;
  /** The review text. Keep it as written by the customer. */
  text: string;
  /** Human-readable "when", e.g. "2 weeks ago" or "March 2026". */
  relativeTime: string;
  /** Optional reviewer photo URL. Falls back to an initial avatar. */
  avatar?: string;
}

interface FeaturableReview {
  author?: { name?: string; avatarUrl?: string };
  rating?: { value?: number };
  text?: string;
  publishedAt?: string;
}

/** TODO: Replace every entry below with a real Google review. */
export const googleReviews: GoogleReview[] = [
  {
    author: "Lakshmi Prasad",
    rating: 5,
    text: "Sri Sai Bhaktanjaneya Sweets is the undisputed pioneer of Tapeswaram Kaja! The taste of their ghee kaja is absolutely divine and authentic. It is a must-buy whenever you visit Rajahmundry.",
    relativeTime: "2 weeks ago",
  },
  {
    author: "Ravi Teja",
    rating: 5,
    text: "Outstanding quality and taste! Their special jalebi and traditional Madatha Kaja are heavenly. The packing is neat and perfect for sending gifts to family.",
    relativeTime: "a month ago",
  },
  {
    author: "Sneha Reddy",
    rating: 5,
    text: "Wonderful customer service and a great variety of traditional Andhra sweets. The Kobbari Kajikai and milk sweets are exceptionally fresh and delicious.",
    relativeTime: "a month ago",
  },
  {
    author: "Anil Kumar",
    rating: 5,
    text: "Authentic, high-quality sweets made with pure ghee. We ordered corporate gift boxes and the feedback from everyone was fantastic. Professional service throughout.",
    relativeTime: "2 months ago",
  },
];

/** Aggregate rating shown next to the section heading. Update to match Google. */
export const googleRatingSummary = {
  average: 4.4,
  count: 142,
};

/** Format an ISO timestamp as a Google-style relative time, e.g. "2 weeks ago". */
function toRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "recently";
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return "today";
  if (days < 7) return days === 1 ? "a day ago" : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "a week ago" : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "a month ago" : `${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? "a year ago" : `${years} years ago`;
}

/**
 * Fetches reviews from Featurable's public widget API (free, no key, no Google
 * API) and maps them to our GoogleReview shape. Returns null if not configured
 * or the request fails, so the caller can fall back.
 */
export async function getFeaturableReviews() {
  const widgetId = process.env.NEXT_PUBLIC_FEATURABLE_WIDGET_ID;
  if (!widgetId) return null;

  try {
    const res = await fetch(
      `https://featurable.com/api/v2/widgets/${widgetId}`,
      // Cache for 30 min so we don't hit a slow third-party on every page load,
      // and cap the request at 4s so a hanging service can never block render.
      { next: { revalidate: 1800 }, signal: AbortSignal.timeout(4000) },
    );
    const data = await res.json();
    const widget = data?.widget;
    if (!data?.success || !widget) {
      console.warn("Featurable API returned no widget data:", data?.message ?? data);
      return null;
    }

    const reviews: GoogleReview[] = (widget.reviews ?? [])
      .filter((r: FeaturableReview) => r?.text && r.text.trim().length > 0)
      .map((r: FeaturableReview) => ({
        author: r.author?.name ?? "Google user",
        rating: r.rating?.value ?? 5,
        text: r.text,
        relativeTime: toRelativeTime(r.publishedAt ?? ""),
        avatar: r.author?.avatarUrl ?? undefined,
      }));

    const summary = widget.gbpLocationSummary ?? {};
    return {
      reviews: reviews.length ? reviews : googleReviews,
      ratingSummary: {
        average: summary.rating ?? googleRatingSummary.average,
        count: summary.reviewsCount ?? googleRatingSummary.count,
      },
    };
  } catch (error) {
    console.error("Error fetching Featurable reviews:", error);
    return null;
  }
}

/**
 * Live reviews for the homepage. Prefers the free Featurable API, then the
 * Google Places API, then hand-curated placeholders.
 */
export async function getLiveGoogleReviews() {
  const featurable = await getFeaturableReviews();
  if (featurable) return featurable;

  const placeId = process.env.GOOGLE_PLACE_ID;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!placeId || !apiKey) {
    return {
      reviews: googleReviews,
      ratingSummary: googleRatingSummary,
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
    const res = await fetch(url, {
      next: { revalidate: process.env.NODE_ENV === "development" ? 0 : 1800 },
      signal: AbortSignal.timeout(4000),
    });
    
    const data = await res.json();
    if (data.status !== "OK" || !data.result) {
      console.warn(
        `Google Places API returned status: ${data.status}.` +
        (data.error_message ? ` Error Message: ${data.error_message}` : "")
      );
      return {
        reviews: googleReviews,
        ratingSummary: googleRatingSummary,
      };
    }

    type PlacesReview = {
      author_name?: string;
      rating?: number;
      text?: string;
      relative_time_description?: string;
      profile_photo_url?: string;
    };

    const mappedReviews: GoogleReview[] = (
      (data.result.reviews as PlacesReview[] | undefined) || []
    ).map((r) => ({
      author: r.author_name ?? "Google user",
      rating: r.rating ?? 5,
      text: r.text ?? "",
      relativeTime: r.relative_time_description ?? "",
      avatar: r.profile_photo_url,
    }));

    return {
      reviews: mappedReviews.length ? mappedReviews : googleReviews,
      ratingSummary: {
        average: data.result.rating || googleRatingSummary.average,
        count: data.result.user_ratings_total || googleRatingSummary.count,
      },
    };
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return {
      reviews: googleReviews,
      ratingSummary: googleRatingSummary,
    };
  }
}

