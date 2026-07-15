"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

export function ProductCarousel({
  eyebrow,
  title,
  viewAllHref,
  products,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  viewAllHref?: string;
  products: Product[];
  align?: "left" | "center";
  className?: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (!products.length) return null;

  const arrowClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-cream-300 bg-white text-maroon-800 transition-colors hover:bg-maroon-800 hover:text-cream-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-maroon-800";

  return (
    <section className={cn("py-12", className)}>
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          align={align}
          action={
            <div className="flex items-center gap-2">
              {viewAllHref && (
                <Link
                  href={viewAllHref}
                  className="mr-1 hidden text-sm font-semibold text-maroon-800 underline-offset-4 hover:text-saffron-600 hover:underline sm:inline"
                >
                  View all
                </Link>
              )}
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canPrev}
                aria-label="Previous"
                className={arrowClass}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canNext}
                aria-label="Next"
                className={arrowClass}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          }
        />

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 md:gap-5 h-full">
            {products.map((p) => (
              <div
                key={p.id}
                className="min-w-0 shrink-0 basis-[72%] sm:basis-[45%] md:basis-[31%] lg:basis-[23.5%] h-full"
              >
                <div className="h-full">
                  <ProductCard product={p} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {viewAllHref && (
          <div className="mt-6 text-center sm:hidden">
            <Link
              href={viewAllHref}
              className="text-sm font-semibold text-maroon-800 underline underline-offset-4"
            >
              View all
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
