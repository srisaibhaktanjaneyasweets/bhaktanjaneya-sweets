import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ValueProps } from "@/components/home/ValueProps";
import { aboutContent } from "@/lib/content";
import { config } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The story behind Bhaktanjaneya Sweets — pure ghee, family recipes, and small-batch sweets and namkeen made fresh for Telugu homes across India.",
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-maroon-900 py-16 text-cream-50">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-saffron-400/15 px-4 py-1.5 text-sm font-medium text-saffron-300">
              <Sparkles size={15} /> Our Story
            </p>
            <h1 className="mt-5 font-serif text-3xl font-bold sm:text-4xl">
              Pure ghee. Family recipes. Made with devotion.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-cream-100/85">
              {aboutContent.intro}
            </p>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="border-b border-cream-200 bg-cream-50 py-10">
        <Container>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {aboutContent.stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-serif text-3xl font-bold text-maroon-800">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Story */}
      <section className="py-14">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">
              How it all began
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-600">
              {aboutContent.story.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <ValueProps />

      {/* CTA */}
      <section className="py-14">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-3xl border border-cream-200 bg-white p-8 text-center shadow-soft sm:p-12">
            <h2 className="font-serif text-2xl font-bold text-maroon-900">
              Taste the difference for yourself
            </h2>
            <p className="max-w-xl text-ink-500">
              Browse our handmade sweets and crunchy namkeen, or message us on
              WhatsApp — we&apos;re always happy to help.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center rounded-full bg-maroon-800 px-7 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
              >
                Shop all products
              </Link>
              <a
                href={waLink(`Hello ${config.businessName}! I'd like to know more.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#35B664] px-7 text-sm font-semibold text-white hover:bg-[#2E9E57]"
              >
                <MessageCircle size={18} /> Chat with us
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
