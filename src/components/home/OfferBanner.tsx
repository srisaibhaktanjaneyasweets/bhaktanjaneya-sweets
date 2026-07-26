import Link from "next/link";
import { BadgePercent, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { OfferBannerSettings } from "@/lib/offer-banner";

export function OfferBanner({ settings }: { settings: OfferBannerSettings }) {
  if (!settings || !settings.visible) return null;

  // Split description by the coupon code to style it as a highlighted pill dynamically
  const code = settings.code || "";
  const desc = settings.description || "";
  let renderedDescription: React.ReactNode = desc;

  if (code && desc.includes(code)) {
    const parts = desc.split(code);
    renderedDescription = (
      <>
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="mx-1 rounded bg-cream-50 px-2 py-0.5 font-bold text-maroon-900 shadow-sm whitespace-nowrap">
                {code}
              </span>
            )}
          </span>
        ))}
      </>
    );
  }

  return (
    <section className="py-12">
      <Container>
        <div className="offer-glow relative overflow-hidden rounded-2xl bg-gradient-to-br from-maroon-800 via-maroon-900 to-maroon-950 px-6 py-12 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-500/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-pista-500/12 blur-2xl" />
          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-cream-50/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-saffron-300 ring-1 ring-inset ring-cream-50/15">
              <BadgePercent size={15} /> {settings.badge}
            </span>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-cream-50 sm:text-4xl">
              {settings.title}
            </h2>
            <p className="mt-3 font-medium text-cream-100/80 leading-relaxed">
              {renderedDescription}
            </p>
            <Link
              href={settings.buttonLink || "/shop"}
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-gold-500 px-8 text-sm font-semibold text-maroon-900 shadow-sm transition-colors hover:bg-gold-400"
            >
              {settings.buttonText || "Shop now"} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
