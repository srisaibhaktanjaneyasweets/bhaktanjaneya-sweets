"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { InstagramReel } from "@/lib/instagram-reels";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { cn } from "@/lib/utils";

function retryInstagramThumbnail(sourceUrl?: string) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // RSS/Instagram CDN URLs can briefly fail due to an edge-cache miss. Retry
    // the original feed URL once; do not substitute unrelated static artwork.
    if (!sourceUrl || img.dataset.retried) return;
    img.dataset.retried = "1";
    img.src = sourceUrl;
  };
}

export function ReelsCarousel({ reels }: { reels: InstagramReel[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: reels.length > 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onInit = useCallback((api: EmblaCarouselType) => {
    setScrollSnaps(api.scrollSnapList());
  }, []);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on("reInit", onInit);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onInit, onSelect]);

  // Force Embla to recalculate snaps once mounted and data is ready
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, reels]);

  // Autoplay Effect (auto-sliding reels every 5 seconds)
  useEffect(() => {
    if (!emblaApi || reels.length <= 1) return;
    const intervalId = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [emblaApi, reels.length]);

  if (!reels || reels.length === 0) return null;

  return (
    <div className="relative w-full px-4 sm:px-12">
      {/* Embla Carousel Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-6">
          {reels.map((r) => {
            const caption = (r.caption ?? "").split("#")[0].trim();
            return (
              <div
                key={r.id || r.link}
                className="min-w-0 flex-[0_0_78%] sm:flex-[0_0_320px] lg:flex-[0_0_360px] pl-6"
              >
                <a
                  href={r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={caption ? `Watch reel: ${caption}` : "Watch reel on Instagram"}
                  className="group relative block aspect-[9/16] w-full overflow-hidden rounded-2xl border border-cream-200 bg-black shadow-card transition-all duration-300 hover:shadow-md"
                >
                  {/* Reel cover image (the RSS/Graph feed provides a thumbnail,
                      not a playable video — tapping opens the reel on Instagram). */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.thumbnail}
                    alt={caption || "Instagram reel"}
                    loading="lazy"
                    onError={retryInstagramThumbnail(r.sourceThumbnail)}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />

                  {/* Gradient overlays for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

                  {/* Branded pill overlay (top-left) */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-maroon-800 shadow-sm backdrop-blur-sm">
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-[9px] font-bold text-white leading-none">
                      B
                    </span>
                    Bhaktanjaneya Sweets
                  </div>

                  {/* Play button (center) */}
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-maroon-800 shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Play size={24} fill="currentColor" className="ml-0.5" aria-hidden="true" />
                    </span>
                  </div>

                  {/* Caption (bottom) */}
                  {caption ? (
                    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
                      <p className="line-clamp-2 text-sm leading-snug text-white/90">
                        {caption}
                      </p>
                    </div>
                  ) : null}

                  {/* Duration badge (bottom-right) */}
                  {r.duration ? (
                    <div className="absolute bottom-3 right-3 z-20 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white tracking-wider backdrop-blur-sm">
                      {r.duration}
                    </div>
                  ) : null}
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Chevrons */}
      {reels.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous reel"
            className="absolute left-0 top-1/2 z-10 hidden sm:flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border bg-cream-50 text-maroon-800 transition-all hover:bg-white hover:border-maroon-800 active:scale-95 shadow-sm"
            style={{ borderColor: "var(--color-maroon-800)", borderStyle: "solid", borderWidth: "1px" }}
          >
            <ChevronLeft size={22} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next reel"
            className="absolute right-0 top-1/2 z-10 hidden sm:flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border bg-cream-50 text-maroon-800 transition-all hover:bg-white hover:border-maroon-800 active:scale-95 shadow-sm"
            style={{ borderColor: "var(--color-maroon-800)", borderStyle: "solid", borderWidth: "1px" }}
          >
            <ChevronRight size={22} className="stroke-[2.5]" />
          </button>
        </>
      )}

      {/* Navigation Dots */}
      {scrollSnaps.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === selectedIndex
                  ? "w-5 bg-maroon-800"
                  : "w-1.5 bg-maroon-800/20 hover:bg-maroon-800/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
