"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Category } from "@/lib/types";

const CATEGORY_PALETTES: Record<string, { background: string; ring: string; text: string }> = {
  sweets: { background: "linear-gradient(135deg, #fbbf5b, #d97706)", ring: "#f7c45b", text: "#4a1d08" },
  podis: { background: "linear-gradient(135deg, #f97316, #be123c)", ring: "#ef8b37", text: "#fff7ed" },
  "namkeen-and-mixture": { background: "linear-gradient(135deg, #f8c968, #c77813)", ring: "#e8ae42", text: "#54290a" },
  namkeen: { background: "linear-gradient(135deg, #f8c968, #c77813)", ring: "#e8ae42", text: "#54290a" },
  "veg-pickles": { background: "linear-gradient(135deg, #3d943d, #155c2d)", ring: "#6baa42", text: "#f7fee7" },
  "nonveg-pickles": { background: "linear-gradient(135deg, #9b2c2c, #581c1c)", ring: "#d06c47", text: "#fff7ed" },
  "special-combos": { background: "linear-gradient(135deg, #d8891a, #8b3e0a)", ring: "#cf8b2c", text: "#fff8df" },
  snacks: { background: "linear-gradient(135deg, #0f766e, #164e63)", ring: "#36a59b", text: "#ecfeff" },
};

const FALLBACK_PALETTES = [
  { background: "linear-gradient(135deg, #7c3aed, #4c1d95)", ring: "#9b71e8", text: "#f5f3ff" },
  { background: "linear-gradient(135deg, #0f766e, #155e75)", ring: "#36a59b", text: "#ecfeff" },
  { background: "linear-gradient(135deg, #be185d, #831843)", ring: "#db6091", text: "#fff1f2" },
];

function categoryPalette(slug: string) {
  if (CATEGORY_PALETTES[slug]) return CATEGORY_PALETTES[slug];
  const hash = [...slug].reduce((total, char) => total + char.charCodeAt(0), 0);
  return FALLBACK_PALETTES[hash % FALLBACK_PALETTES.length];
}

export function CategoryRail({ categories }: { categories: Category[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 360), behavior: "smooth" });
  }

  return (
    <div className="relative">
      {/* Left edge: fade + arrow, shown only when more items exist to the left */}
      {canLeft && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-cream-50 to-transparent" />
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            aria-label="Scroll categories left"
            className="absolute left-0 top-[48px] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-maroon-800 shadow-sm transition hover:bg-maroon-800/5 sm:top-[58px]"
          >
            <ChevronLeft size={20} />
          </button>
        </>
      )}

      <div
        ref={scrollerRef}
        className="flex snap-x scroll-px-1 items-start gap-x-5 overflow-x-auto px-1 py-2 sm:gap-x-8 md:justify-center md:gap-x-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-cat-scroll
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${encodeURIComponent(category.slug)}`}
            className="group flex w-[80px] shrink-0 snap-start flex-col items-center sm:w-[100px]"
          >
            <div
              className="rounded-full p-[2px] shadow-sm transition duration-200 group-hover:scale-[1.04] group-hover:shadow-card"
              style={{ backgroundColor: categoryPalette(category.slug).ring }}
            >
              <div
                className="relative flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full border-2 border-white px-2 text-center font-serif text-xs font-semibold leading-tight shadow-inner sm:h-[100px] sm:w-[100px] sm:px-3 sm:text-sm"
                style={{
                  background: categoryPalette(category.slug).background,
                  color: categoryPalette(category.slug).text,
                }}
              >
                <span className="relative z-10 line-clamp-3">{category.name}</span>
                <span className="absolute -left-4 top-5 h-10 w-10 rounded-full bg-white/20" />
                <span className="absolute -right-3 bottom-3 h-7 w-7 rounded-full bg-white/15" />
              </div>
            </div>
            <span className="mt-3 line-clamp-2 h-[2.2rem] text-center text-xs font-medium leading-snug tracking-tight text-maroon-900/90 transition-colors group-hover:text-maroon-700 sm:text-[13px]">
              {category.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Right edge: fade + arrow, shown only when more items exist to the right */}
      {canRight && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-cream-50 to-transparent" />
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            aria-label="Scroll categories right"
            className="absolute right-0 top-[48px] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-maroon-800 shadow-sm transition hover:bg-maroon-800/5 sm:top-[58px]"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
