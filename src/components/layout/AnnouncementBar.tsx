"use client";

import { useEffect, useState } from "react";
import { Truck, BadgePercent, MessageCircle } from "lucide-react";
import { config } from "@/lib/config";
import { formatINR, cn } from "@/lib/utils";

const items = [
  {
    icon: Truck,
    text: `Free shipping on orders over ${formatINR(config.freeShippingThreshold)}`,
  },
  { icon: BadgePercent, text: "Use code BAS10 for 10% off your first order" },
  { icon: MessageCircle, text: `Order on WhatsApp: ${config.contact.phone}` },
];

export function AnnouncementBar() {
  // Mobile shows one message at a time and rotates through them; desktop has
  // room to show all three at once (handled by the static row below).
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return; // respect reduced-motion: don't auto-rotate
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-maroon-900 text-cream-100">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-xs sm:text-[13px]">
        {/* Mobile: single rotating message (carousel). */}
        <div className="relative h-4 w-full overflow-hidden lg:hidden" aria-live="polite">
          {items.map(({ icon: Icon, text }, i) => (
            <span
              key={text}
              className={cn(
                "absolute inset-0 flex items-center justify-center gap-1.5 whitespace-nowrap transition-opacity duration-500",
                i === index ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={i !== index}
            >
              <Icon size={14} className="shrink-0 text-saffron-400" />
              {text}
            </span>
          ))}
        </div>

        {/* Desktop: all messages inline. */}
        <div className="hidden items-center justify-center gap-x-8 lg:flex">
          {items.map(({ icon: Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Icon size={14} className="shrink-0 text-saffron-400" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
