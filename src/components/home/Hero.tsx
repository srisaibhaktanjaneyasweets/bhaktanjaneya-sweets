"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Pause, Play } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

const slides = [
  {
    eyebrow: "100% Pure Ghee • No Artificial Flavours",
    title: "Traditional Sweets, Made Fresh Every Day",
    text: "From melt-in-your-mouth Kaju Patisa to homestyle Junnu — crafted in small batches with pure ghee and love.",
    primary: { href: "/collections/sweets", label: "Shop Sweets" },
    secondary: { href: "/shop?tag=best-seller", label: "Best Sellers" },
    image: "/images/categories/sweets.svg",
    theme: "from-maroon-800 via-maroon-800 to-maroon-900",
  },
  {
    eyebrow: "Crunchy • Spiced • Fresh",
    title: "Namkeen & Mixtures for Every Tea Time",
    text: "Agra Mixture, Chakidalu, Flower Janthukulu and more — the perfect crunchy companions to your chai.",
    primary: { href: "/collections/namkeen", label: "Shop Namkeen" },
    secondary: { href: "/shop", label: "Explore All" },
    image: "/images/categories/namkeen.svg",
    theme: "from-saffron-600 via-saffron-600 to-maroon-800",
  },
  {
    eyebrow: "Welcome Offer",
    title: "Get 10% Off Your First Order",
    text: "Use code BAS10 on orders above ₹500. Free shipping over ₹700, delivered fresh across India.",
    primary: { href: "/shop", label: "Start Shopping" },
    secondary: { href: "/bulk-orders", label: "Bulk Orders" },
    image: "/images/categories/sweets.svg",
    theme: "from-gold-600 via-saffron-600 to-maroon-800",
  },
];

export function Hero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
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
    if (!emblaApi || paused || reducedMotion) return;
    const id = setInterval(() => emblaApi.scrollNext(), 5500);
    return () => clearInterval(id);
  }, [emblaApi, paused, reducedMotion]);

  return (
    <section className="bg-cream-100 pb-2 pt-4 sm:pt-6">
      <Container>
        <div className="overflow-hidden rounded-3xl" ref={emblaRef}>
          <div className="flex">
            {slides.map((s) => (
              <div key={s.title} className="min-w-0 flex-[0_0_100%]">
                <div
                  className={cn(
                    "relative flex min-h-[440px] items-center overflow-hidden bg-gradient-to-br px-6 py-12 sm:px-12 md:min-h-[480px]",
                    s.theme,
                  )}
                >
                  {/* decorative glow */}
                  <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-cream-50/10 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-saffron-400/10 blur-2xl" />

                  <div className="relative grid w-full items-center gap-8 md:grid-cols-2">
                    <div className="max-w-xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron-300">
                        {s.eyebrow}
                      </p>
                      <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-cream-50 sm:text-4xl md:text-5xl">
                        {s.title}
                      </h1>
                      <p className="mt-4 max-w-md text-sm leading-relaxed text-cream-100/85 sm:text-base">
                        {s.text}
                      </p>
                      <div className="mt-7 flex flex-wrap gap-3">
                        <Link
                          href={s.primary.href}
                          className="inline-flex h-12 items-center gap-2 rounded-full bg-saffron-500 px-7 text-sm font-semibold text-maroon-900 transition-colors hover:bg-saffron-400"
                        >
                          {s.primary.label}
                          <ArrowRight size={18} />
                        </Link>
                        <Link
                          href={s.secondary.href}
                          className="inline-flex h-12 items-center rounded-full border border-cream-50/40 px-7 text-sm font-semibold text-cream-50 transition-colors hover:bg-cream-50/10"
                        >
                          {s.secondary.label}
                        </Link>
                      </div>
                    </div>

                    <div className="hidden justify-self-center md:block">
                      <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-cream-50/10 ring-1 ring-cream-50/20 lg:h-80 lg:w-80">
                        <Image
                          src={s.image}
                          alt=""
                          width={240}
                          height={240}
                          className="h-44 w-44 object-contain drop-shadow-xl lg:h-56 lg:w-56"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* dots */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === selected
                  ? "w-6 bg-maroon-800"
                  : "w-2 bg-maroon-800/30 hover:bg-maroon-800/50",
              )}
            />
          ))}
          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              aria-pressed={paused}
              className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-maroon-800/70 transition-colors hover:bg-maroon-800/5 hover:text-maroon-800"
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
            </button>
          )}
        </div>
      </Container>
    </section>
  );
}
