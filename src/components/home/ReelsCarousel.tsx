"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import type { InstagramReel } from "@/lib/instagram-reels";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

const FALLBACK_COVERS = [
  "/images/tapeswaram_kaja_reel.png",
  "/images/madatha_kaja_reel.png",
  "/images/special_mixture_reel.png",
  "/images/ghee_ladoo_reel.png",
];

function swapToFallback(index: number) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.fallback) return;
    img.dataset.fallback = "1";
    img.src = FALLBACK_COVERS[index % FALLBACK_COVERS.length];
  };
}

const FALLBACK_VIDEOS = [
  "https://player.vimeo.com/external/435674703.sd.mp4?s=7fdf27e2213e4b77f98c8d8b671a53c9e6d0a7a0&profile_id=165&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/384761655.sd.mp4?s=38dbbb615015b6510f22d64a27546522c0627d7e&profile_id=165&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/459389137.sd.mp4?s=872719d3fbd20078b53051493026f8bf962d3a2c&profile_id=165&oauth2_token_id=57447761",
  "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c02271881e59db10472b101684c3c3a9&profile_id=139&oauth2_token_id=57447761",
];

export function ReelsCarousel({ reels }: { reels: InstagramReel[] }) {
  // Ensure we have at least 8 items to support smooth infinite loop scrolling on all viewports, memoized to prevent infinite render loops
  const displayReels = useMemo(() => {
    let result = [...reels];
    if (result.length > 0 && result.length < 8) {
      const original = [...result];
      while (result.length < 8) {
        result = [...result, ...original];
      }
    }
    return result;
  }, [reels]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: displayReels.length > 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onInit = useCallback((api: any) => {
    setScrollSnaps(api.scrollSnapList());
  }, []);

  const onSelect = useCallback((api: any) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
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
  }, [emblaApi, displayReels]);

  // Autoplay Effect (auto-sliding reels every 5 seconds)
  useEffect(() => {
    if (!emblaApi || displayReels.length <= 1) return;
    const intervalId = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [emblaApi, displayReels.length]);

  if (!reels || reels.length === 0) return null;

  return (
    <div className="relative w-full px-4 sm:px-12">
      {/* Embla Carousel Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-6">
          {displayReels.map((r, i) => {
            const videoUrl = r.videoUrl || FALLBACK_VIDEOS[i % FALLBACK_VIDEOS.length];
            return (
              <div
                key={`${r.id || r.link}-${i}`}
                className="min-w-0 flex-[0_0_230px] sm:flex-[0_0_250px] pl-6"
              >
                <a
                  href={r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-[9/16] w-full overflow-hidden rounded-2xl border border-cream-200 bg-black shadow-card transition-all duration-300 hover:shadow-md"
                >
                  {/* Reel Cover Video */}
                  <video
                    src={videoUrl}
                    poster={r.thumbnail}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                
                  {/* Gradient overlays for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                  {/* Branded pill overlay (top-left) */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-maroon-800 shadow-sm backdrop-blur-sm">
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-[9px] font-bold text-white leading-none">
                      B
                    </span>
                    Bhaktanjaneya Sweets
                  </div>

                  {/* Central Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/30">
                      <Play size={24} className="translate-x-0.5 fill-white" />
                    </span>
                  </div>

                  {/* Caption Text (bottom-left) */}
                  <div className="absolute bottom-4 left-4 right-16 z-10">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-white drop-shadow-md">
                      {r.caption.split("#")[0].trim()}
                    </p>
                  </div>

                  {/* Duration Badge (bottom-right) */}
                  <div className="absolute bottom-4 right-4 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white tracking-wider backdrop-blur-sm">
                    {r.duration || "00:30"}
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Chevrons — styled exactly like Google reviews in Testimonials.tsx */}
      {displayReels.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous reel"
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border bg-cream-50 text-maroon-800 transition-all hover:bg-white hover:border-maroon-800 active:scale-95 shadow-sm"
            style={{ borderColor: "var(--color-maroon-800)", borderStyle: "solid", borderWidth: "1px" }}
          >
            <ChevronLeft size={22} className="stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next reel"
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border bg-cream-50 text-maroon-800 transition-all hover:bg-white hover:border-maroon-800 active:scale-95 shadow-sm"
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
