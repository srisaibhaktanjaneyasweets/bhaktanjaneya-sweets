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

/**
 * Fetches live reviews from the Google Places API server-side.
 * Falls back to hand-curated placeholders if API keys are not configured.
 */
export async function getLiveGoogleReviews() {
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
      next: { revalidate: 0 }, // Temporarily disable cache to force fresh calls during configuration testing
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

