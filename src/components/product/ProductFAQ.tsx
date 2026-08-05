import { ChevronDown } from "lucide-react";
import type { FAQItem } from "@/lib/faq";

export function ProductFAQ({ faqs }: { faqs: FAQItem[] }) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="mt-8 sm:mt-12 rounded-xl sm:rounded-2xl border border-saffron-200 bg-white p-4 sm:p-8 shadow-sm">
      <h2 className="mb-4 sm:mb-6 font-serif text-xl sm:text-2xl font-bold text-maroon-900">
        Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group rounded-lg border border-saffron-100 bg-cream-50"
          >
            <summary className="flex cursor-pointer items-center justify-between p-3 sm:p-4 text-sm sm:text-base font-semibold text-maroon-900 list-none [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronDown
                size={20}
                className="text-saffron-700 transition-transform duration-300 group-open:rotate-180"
              />
            </summary>
            <div className="px-3 pb-3 sm:px-4 sm:pb-4 text-xs sm:text-sm leading-relaxed text-ink-700">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
