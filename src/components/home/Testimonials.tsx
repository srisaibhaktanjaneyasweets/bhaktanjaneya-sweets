"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Star, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import useEmblaCarousel from "embla-carousel-react";
import { config } from "@/lib/config";

interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

const CUSTOM_TESTIMONIALS: TestimonialItem[] = [
  {
    quote: "You can tell they don't compromise on ingredients. The taste is rich yet light-perfect for festivals and gifting.",
    name: "RAVI PRAKASH",
    role: "ACTOR",
    avatar: "/images/categories/sweets.svg",
  },
  {
    quote: "I've ordered multiple times, and the taste and freshness are always the same. Packaging is neat, hygienic, and delivery is timely.",
    name: "MARUTHI",
    role: "DIRECTOR",
    avatar: "/images/categories/snacks.svg",
  },
];

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

export function Testimonials({ reviews, ratingSummary }: any) {
  // Memoize the compiled reviews list to prevent reference changing and triggering infinite useEffect loops
  const displayTestimonials = useMemo(() => {
    const base = [
      ...CUSTOM_TESTIMONIALS,
      ...(reviews || []).map((r: any, idx: number) => ({
        quote: r.text,
        name: r.author.toUpperCase(),
        role: "CUSTOMER",
        avatar: idx % 2 === 0 ? "/images/categories/sweets.svg" : "/images/categories/snacks.svg",
      })),
    ];
    let result = [...base];
    if (result.length > 0 && result.length < 6) {
      const original = [...result];
      while (result.length < 6) {
        result = [...result, ...original];
      }
    }
    return result;
  }, [reviews]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: displayTestimonials.length > 1,
    slidesToScroll: 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback((api: any) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  // Force Embla to recalculate/re-init once mounted and data is ready
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, displayTestimonials]);

  // Autoplay Effect (auto-sliding reviews every 5 seconds)
  useEffect(() => {
    if (!emblaApi || displayTestimonials.length <= 1) return;
    const intervalId = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [emblaApi, displayTestimonials.length]);

  const summary = ratingSummary || { average: 4.6, count: 750 };

  return (
    <section className="py-16 bg-cream-50/30">
      <Container>
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
            A Taste Loved by Many
          </h2>
        </div>


        <div className="relative px-4 sm:px-12">
          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-6">
              {displayTestimonials.map((t, idx) => (
                <div
                  key={`${t.name}-${idx}`}
                  className="min-w-0 flex-[0_0_100%] pl-6 md:flex-[0_0_50%]"
                >
                  <div className="flex h-full flex-col items-center justify-between rounded-xl bg-zinc-200/60 p-8 text-center border border-cream-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
                    <blockquote className="text-base font-medium leading-relaxed text-ink-800 max-w-lg mb-6">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>

                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-maroon-800/10 bg-white/80 p-2 flex items-center justify-center">
                        <img
                          src={t.avatar}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-maroon-900 tracking-wide">
                          {t.name}
                        </p>
                        <p className="text-xs font-semibold text-saffron-600">
                          ({t.role})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous review"
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border bg-cream-50 text-maroon-800 transition-all hover:bg-white hover:border-maroon-800 active:scale-95 shadow-sm"
            style={{ borderColor: "var(--color-maroon-800)", borderStyle: "solid", borderWidth: "1px" }}
          >
            <ChevronLeft size={22} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next review"
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border bg-cream-50 text-maroon-800 transition-all hover:bg-white hover:border-maroon-800 active:scale-95 shadow-sm"
            style={{ borderColor: "var(--color-maroon-800)", borderStyle: "solid", borderWidth: "1px" }}
          >
            <ChevronRight size={22} className="stroke-[2.5]" />
          </button>
        </div>
      </Container>
    </section>
  );
}
