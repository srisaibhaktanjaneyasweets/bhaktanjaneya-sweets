import { Star, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ReviewsMarquee } from "@/components/home/ReviewsMarquee";
import { config } from "@/lib/config";
import type { GoogleReview } from "@/lib/google-reviews";

export function ReviewsSection({
  reviews,
  ratingSummary,
}: {
  reviews: GoogleReview[];
  ratingSummary: { average: number; count: number };
}) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="py-16 bg-cream-50">
      <Container>
        <SectionHeading
          eyebrow="Kind words"
          title="A Taste Loved by Many"
          subtitle="From festive gifting to everyday treats — here's what our customers say."
          align="center"
        />
      </Container>

      <Container>
        {/* Aggregate rating + link to the full Google listing. */}
        <div className="-mt-4 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/15 px-4 py-2 shadow-soft ring-1 ring-inset ring-white/40">
            <span className="text-2xl font-bold text-maroon-900">
              {ratingSummary.average.toFixed(1)}
            </span>
            <div className="flex gap-0.5 text-gold-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < Math.round(ratingSummary.average)
                      ? "fill-gold-500"
                      : "text-cream-300"
                  }
                />
              ))}
            </div>
            <span className="text-sm font-medium text-ink-600">
              ({ratingSummary.count.toLocaleString("en-IN")} reviews)
            </span>
          </div>
        </div>
      </Container>

      {/* ReviewsMarquee supplies its own max-width wrapper + edge fades. */}
      <ReviewsMarquee reviews={reviews} />

      <Container>
        <div className="mt-8 flex justify-center">
          <a
            href={config.googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-800 underline-offset-4 hover:text-saffron-600 hover:underline"
          >
            Read all reviews on Google
            <ExternalLink size={14} />
          </a>
        </div>
      </Container>
    </section>
  );
}
