"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import type { GoogleReview } from "@/lib/google-reviews";

/** Google "G" logo — official four-colour mark, inline so it needs no asset. */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-saffron-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={15} className={i < rating ? "fill-saffron-500" : "text-cream-300"} />
      ))}
    </div>
  );
}

function Avatar({ review }: { review: GoogleReview }) {
  if (review.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={review.avatar}
        alt=""
        referrerPolicy="no-referrer"
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-sm font-bold text-cream-50">
      {review.author.charAt(0).toUpperCase()}
    </span>
  );
}

/** Reviews longer than this (chars) get a "Read more" link to the full text. */
const READ_MORE_THRESHOLD = 150;

export function ReviewsMarquee({ reviews }: { reviews: GoogleReview[] }) {
  const [active, setActive] = useState<GoogleReview | null>(null);

  // While the modal is open: close on Escape and lock background scroll.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <>
      {/* Auto-scrolling marquee of reviews (pauses on hover) */}
      <div className="marquee-group relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <ul
          className="flex w-max animate-marquee"
          style={{ ["--marquee-duration" as string]: `${Math.max(24, reviews.length * 9)}s` }}
        >
          {[...reviews, ...reviews].map((r, idx) => {
            const isClone = idx >= reviews.length;
            const isLong = r.text.length > READ_MORE_THRESHOLD;
            return (
              <li
                key={`${r.author}-${idx}`}
                className="mr-5 w-[280px] shrink-0 sm:w-[330px]"
                aria-hidden={isClone}
              >
                <figure className="flex h-[260px] flex-col rounded-2xl border border-cream-200 bg-white p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <Stars rating={r.rating} />
                    <GoogleG className="h-4 w-4 shrink-0" />
                  </div>

                  <blockquote className="mt-3 text-sm leading-relaxed text-ink-700 line-clamp-4">
                    &ldquo;{r.text}&rdquo;
                  </blockquote>

                  {isLong && (
                    <button
                      type="button"
                      onClick={() => setActive(r)}
                      tabIndex={isClone ? -1 : 0}
                      className="mt-1.5 self-start text-xs font-semibold text-saffron-600 transition-colors hover:text-saffron-700"
                    >
                      Read more
                    </button>
                  )}

                  <figcaption className="mt-auto flex items-center gap-3 pt-4">
                    <Avatar review={r} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-maroon-900">{r.author}</p>
                      <p className="text-xs text-ink-400">Posted on Google · {r.relativeTime}</p>
                    </div>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Full-review modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-ink-900/60" onClick={() => setActive(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-maroon-800 hover:bg-maroon-800/5"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between gap-4 pr-8">
              <Stars rating={active.rating} />
              <GoogleG className="h-5 w-5 shrink-0" />
            </div>

            <blockquote className="mt-4 max-h-[55vh] overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-ink-700">
              &ldquo;{active.text}&rdquo;
            </blockquote>

            <div className="mt-5 flex items-center gap-3 border-t border-cream-200 pt-4">
              <Avatar review={active} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-maroon-900">{active.author}</p>
                <p className="text-xs text-ink-400">Posted on Google · {active.relativeTime}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
