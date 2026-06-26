import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FaqAccordion } from "@/components/FaqAccordion";
import { faqs } from "@/lib/content";
import { config } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about ordering, ingredients, freshness, delivery, and payments at Bhaktanjaneya Sweets.",
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="py-12">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
              Frequently asked questions
            </h1>
            <p className="mt-3 text-ink-500">
              Everything you need to know about ordering from us.
            </p>
          </div>

          <div className="mt-8">
            <FaqAccordion items={faqs} />
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-cream-200 bg-cream-50 p-7 text-center">
            <p className="font-medium text-maroon-900">
              Still have a question?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={waLink(`Hello ${config.businessName}! I have a question.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#35B664] px-6 text-sm font-semibold text-white hover:bg-[#2E9E57]"
              >
                <MessageCircle size={17} /> Ask on WhatsApp
              </a>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center rounded-full border border-maroon-800/30 px-6 text-sm font-semibold text-maroon-800 hover:bg-maroon-800/5"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
