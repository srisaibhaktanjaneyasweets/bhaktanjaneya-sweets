import { Star, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { config } from "@/lib/config";
import { GoogleReview } from "@/lib/google-reviews";

/** Google "G" logo — official four-colour mark, inline so it needs no asset. */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

interface TestimonialsProps {
  reviews: GoogleReview[];
  ratingSummary: {
    average: number;
    count: number;
  };
}

export function Testimonials({ reviews, ratingSummary }: TestimonialsProps) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="py-14">
      <Container>
        <SectionHeading
          eyebrow="Loved on Google"
          title="What our customers say"
        />

        {/* Rating summary + link to Google */}
        <div className="mb-7 flex flex-col items-start gap-4 rounded-2xl border border-cream-200 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <GoogleG className="h-9 w-9 shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-maroon-900">
                  {ratingSummary.average.toFixed(1)}
                </span>
                <span className="flex gap-0.5 text-saffron-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className={
                        i < Math.round(ratingSummary.average)
                          ? "fill-saffron-500"
                          : "text-cream-300"
                      }
                    />
                  ))}
                </span>
              </div>
              <p className="text-xs text-ink-500">
                Based on {ratingSummary.count} Google review
                {ratingSummary.count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <a
            href={config.googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-maroon-800/30 px-5 text-sm font-semibold text-maroon-800 transition-colors hover:bg-maroon-800/5 sm:w-auto"
          >
            Read all reviews on Google
            <ExternalLink size={15} />
          </a>
        </div>

        {/* Auto-scrolling marquee — pauses on hover. The list is repeated 4× so
            one half always exceeds the container width, keeping the loop
            seamless with no empty gap; the mask fades both edges within the
            content column. */}
        <div className="marquee-group relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <ul
            className="flex w-max animate-marquee"
            style={{ ["--marquee-duration" as string]: `${Math.max(24, reviews.length * 9)}s` }}
          >
            {Array.from({ length: 4 })
              .flatMap(() => reviews)
              .map((r, idx) => (
            <li
              key={`${r.author}-${idx}`}
              className="mr-5 w-[280px] shrink-0 sm:w-[330px]"
              aria-hidden={idx >= reviews.length}
            >
              <figure className="flex h-full flex-col rounded-2xl border border-cream-200 bg-white p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5 text-saffron-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={15}
                        className={
                          i < r.rating ? "fill-saffron-500" : "text-cream-300"
                        }
                      />
                    ))}
                  </div>
                  <GoogleG className="h-4 w-4 shrink-0" />
                </div>

                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-700">
                  &ldquo;{r.text}&rdquo;
                </blockquote>

                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-sm font-bold text-cream-50">
                    {r.author.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-maroon-900">
                      {r.author}
                    </p>
                    <p className="text-xs text-ink-400">
                      Posted on Google · {r.relativeTime}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </li>
          ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}



