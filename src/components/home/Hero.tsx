"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

const slides = [
  {
    eyebrow: "100% Pure Ghee • No Artificial Flavours",
    title: "Traditional Sweets, Made Fresh Every Day",
    text: "From melt-in-your-mouth Kaju Patisa to homestyle Junnu — crafted in small batches with pure ghee and love.",
    primary: { href: "/shop", label: "Shop Sweets" },
    secondary: { href: "/shop?tag=best-seller", label: "Best Sellers" },
    image: "/images/hero/hero-laddu.png",
  },
  {
    eyebrow: "Crunchy • Spiced • Fresh",
    title: "Namkeen & Mixtures for Every Tea Time",
    text: "Agra Mixture, Chakidalu, Flower Janthukulu and more — the perfect crunchy companions to your chai.",
    primary: { href: "/shop", label: "Shop Namkeen" },
    secondary: { href: "/shop", label: "Explore All" },
    image: "/images/hero/hero-khaja.png",
  },
  {
    eyebrow: "Welcome Offer",
    title: "Get 10% Off Your First Order",
    text: "Use code BAS10 on orders above ₹500. Free shipping over ₹700, delivered fresh across India.",
    primary: { href: "/shop", label: "Start Shopping" },
    secondary: { href: "/bulk-orders", label: "Bulk Orders" },
    image: "/images/hero/hero-mysorepak.png",
  },
];

export function Hero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || reducedMotion) return;
    const id = setInterval(() => emblaApi.scrollNext(), 5500);
    return () => clearInterval(id);
  }, [emblaApi, reducedMotion]);

  return (
    <section id="hero" className="relative scroll-mt-16 bg-cream-100 lg:scroll-mt-32">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((s, i) => (
            <div key={s.title} className="min-w-0 flex-[0_0_100%]">
              <div className="relative flex min-h-[460px] items-center overflow-hidden py-12 md:min-h-[520px] lg:min-h-[560px]">
                {/* Full-bleed product photo (shows on mobile + desktop) */}
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover object-center"
                />

                {/* Legibility scrim — base tint + stronger fade on the text side,
                    so copy stays readable over both dark and light photos. */}
                <div className="pointer-events-none absolute inset-0 bg-ink-900/40" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-900/85 via-ink-900/55 to-transparent" />

                <Container className="relative">
                  <div className="max-w-xl">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-saffron-300">
                      <span className="inline-block h-1.5 w-1.5 rotate-45 bg-gold-400" />
                      {s.eyebrow}
                    </p>
                    <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-cream-50 drop-shadow-sm sm:text-4xl md:text-5xl">
                      {s.title}
                    </h1>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-cream-100/90 sm:text-base">
                      {s.text}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link
                        href={s.primary.href}
                        className="inline-flex h-12 items-center gap-2 rounded-full bg-gold-500 px-7 text-sm font-semibold text-maroon-900 shadow-sm transition-colors hover:bg-gold-400"
                      >
                        {s.primary.label}
                        <ArrowRight size={18} />
                      </Link>
                      <Link
                        href={s.secondary.href}
                        className="inline-flex h-12 items-center rounded-full border border-cream-50/40 px-7 text-sm font-semibold text-cream-50 backdrop-blur-sm transition-colors hover:bg-cream-50/10"
                      >
                        {s.secondary.label}
                      </Link>
                    </div>
                  </div>
                </Container>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* dots */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === selected
                ? "w-6 bg-gold-400"
                : "w-2 bg-cream-50/50 hover:bg-cream-50/80",
            )}
          />
        ))}
      </div>
    </section>
  );
}
