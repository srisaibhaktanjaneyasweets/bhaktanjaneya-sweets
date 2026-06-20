"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Heart, Play, ChevronLeft, ChevronRight } from "lucide-react";
import type { InstagramReel } from "@/lib/instagram-reels";

const INTERVAL_MS = 5000;

/**
 * Coverflow-style reels carousel: one bright "playing" reel in front with the
 * previous and next reels dimmed behind it. Auto-rotates clockwise (front reel
 * exits to the right, the next enters from the left) when the progress bar
 * fills. Click a back reel to bring it forward, or the front reel to open it.
 */
export function ReelsCarousel({ reels }: { reels: InstagramReel[] }) {
  const n = reels.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Clockwise: the front reel rotates out to the right, the next comes in from
  // the left, so the active index moves backwards through the list.
  const rotateClockwise = useCallback(
    () => setActive((a) => (a - 1 + n) % n),
    [n],
  );
  const rotateCounter = useCallback(
    () => setActive((a) => (a + 1) % n),
    [n],
  );

  useEffect(() => {
    if (reduced || paused || n <= 1) return;
    const id = setTimeout(rotateClockwise, INTERVAL_MS);
    return () => clearTimeout(id);
  }, [active, reduced, paused, n, rotateClockwise]);

  if (n === 0) return null;

  // Signed distance of reel i from the active one, in [-floor(n/2), …].
  function offset(i: number) {
    let d = (i - active) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  return (
    <div
      className="relative mx-auto flex h-[460px] w-full max-w-md items-center justify-center sm:h-[520px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {reels.map((r, i) => {
        const d = offset(i);
        const isCenter = d === 0;
        const isBack = d === -1 || d === 1;
        const visible = isCenter || isBack;

        const transform = isCenter
          ? "translateX(0) scale(1) rotate(0deg)"
          : d === -1
            ? "translateX(-58%) scale(0.82) rotate(-5deg)"
            : d === 1
              ? "translateX(58%) scale(0.82) rotate(5deg)"
              : "translateX(0) scale(0.7)";

        return (
          <div
            key={r.id}
            className="absolute w-[230px] transition-all duration-500 ease-out sm:w-[270px]"
            style={{
              transform,
              zIndex: isCenter ? 30 : isBack ? 20 : 0,
              opacity: visible ? 1 : 0,
              pointerEvents: visible ? "auto" : "none",
            }}
            aria-hidden={!isCenter}
          >
            {isCenter ? (
              <a
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-[9/16] w-full overflow-hidden rounded-3xl border border-cream-200 bg-black shadow-card"
              >
                <Image
                  src={r.thumbnail}
                  alt=""
                  fill
                  sizes="270px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/15" />

                {/* Play button */}
                <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <Play size={22} className="translate-x-0.5 fill-white" />
                </span>

                {/* Caption + stats */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-maroon-800 text-[10px] font-bold text-cream-50">
                      B
                    </span>
                    <span className="truncate text-xs font-semibold text-white">
                      bhaktanjaneyasweets.in
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-medium leading-normal text-white/90">
                    {r.caption}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] font-semibold text-white/80">
                    <span className="flex items-center gap-1">
                      <Heart size={13} className="fill-white/80 text-transparent" />
                      {r.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Play size={11} className="fill-white/80 text-transparent" />
                      {r.views} views
                    </span>
                  </div>
                </div>

                {/* "Now playing" progress bar */}
                <div className="absolute inset-x-0 top-0 h-1 bg-white/15">
                  {!reduced && !paused ? (
                    <div
                      key={active}
                      className="reel-progress h-full bg-saffron-400"
                      style={{ ["--reel-interval" as string]: `${INTERVAL_MS}ms` }}
                    />
                  ) : null}
                </div>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label="Bring reel to front"
                className="relative block aspect-[9/16] w-full overflow-hidden rounded-3xl border border-cream-200 bg-black shadow-soft"
              >
                <Image
                  src={r.thumbnail}
                  alt=""
                  fill
                  sizes="220px"
                  className="object-cover"
                />
                {/* Dark tone for the back reels */}
                <div className="absolute inset-0 bg-ink-900/60" />
              </button>
            )}
          </div>
        );
      })}

      {/* Controls */}
      {n > 1 ? (
        <>
          <button
            type="button"
            onClick={rotateCounter}
            aria-label="Previous reel"
            className="absolute left-0 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cream-300 bg-white/90 text-maroon-800 shadow-soft backdrop-blur transition-colors hover:bg-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={rotateClockwise}
            aria-label="Next reel"
            className="absolute right-0 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cream-300 bg-white/90 text-maroon-800 shadow-soft backdrop-blur transition-colors hover:bg-white"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute -bottom-1 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2">
            {reels.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Go to reel ${i + 1}`}
                className={
                  "h-2 rounded-full transition-all " +
                  (i === active
                    ? "w-6 bg-maroon-800"
                    : "w-2 bg-maroon-800/30 hover:bg-maroon-800/50")
                }
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
