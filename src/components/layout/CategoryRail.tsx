"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { getCategoryImage } from "@/lib/images";
import type { Category } from "@/lib/types";

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
            className="absolute left-0 top-[58px] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-maroon-800 shadow-sm transition hover:bg-maroon-800/5 sm:top-[70px]"
          >
            <ChevronLeft size={20} />
          </button>
        </>
      )}

      <div
        ref={scrollerRef}
        className="flex snap-x scroll-px-1 items-start gap-x-5 overflow-x-auto px-1 py-3 sm:gap-x-8 md:justify-center md:gap-x-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-cat-scroll
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/collections/${category.slug}`}
            className="group flex w-[88px] shrink-0 snap-start flex-col items-center sm:w-[112px]"
          >
            <div className="relative rounded-full bg-gold-400/70 p-[2px] shadow-sm transition duration-200 group-hover:scale-[1.04] group-hover:bg-gold-500 group-hover:shadow-card">
              <div className="relative h-[88px] w-[88px] overflow-hidden rounded-full border-2 border-white bg-cream-100 sm:h-[112px] sm:w-[112px]">
                <Image
                  src={getCategoryImage(category)}
                  alt={category.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
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
            className="absolute right-0 top-[58px] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-maroon-800 shadow-sm transition hover:bg-maroon-800/5 sm:top-[70px]"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
