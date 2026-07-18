"use client";

import { useEffect, useState } from "react";
import { Truck, BadgePercent, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  defaultAnnouncementMessages,
  type AnnouncementMessages,
} from "@/lib/announcement";

export function AnnouncementBar() {
  // Messages are editable from the admin panel (Announcements page); start
  // with the built-in defaults so the bar renders instantly, then swap in the
  // saved texts once they load.
  const [messages, setMessages] = useState<AnnouncementMessages>(
    defaultAnnouncementMessages(),
  );

  useEffect(() => {
    fetch("/api/settings/announcement")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.messages) setMessages((m) => ({ ...m, ...d.messages }));
      })
      .catch(() => {});
  }, []);

  const items = [
    { icon: Truck, text: messages.shipping },
    { icon: BadgePercent, text: messages.offer },
    { icon: MessageCircle, text: messages.whatsapp },
  ];

  // Mobile shows one message at a time and rotates through them; desktop has
  // room to show all three at once (handled by the static row below).
  const [index, setIndex] = useState(0);
  const itemCount = items.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return; // respect reduced-motion: don't auto-rotate
    const id = setInterval(() => setIndex((i) => (i + 1) % itemCount), 4000);
    return () => clearInterval(id);
  }, [itemCount]);

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
