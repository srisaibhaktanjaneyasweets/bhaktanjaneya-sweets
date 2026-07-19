"use client";

import { ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ReelsCarousel } from "@/components/home/ReelsCarousel";
import type { InstagramReel } from "@/lib/instagram-reels";

function InstagramIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

export function InstagramReels({ reels }: { reels: InstagramReel[] }) {
  const instagramUrl = "https://www.instagram.com/bhaktanjaneyasweets.in/reels/";

  return (
    <section className="py-14 bg-cream-50/50 border-t border-cream-200">
      <Container>
        <SectionHeading
          eyebrow="Follow along"
          title="Every Reel, A Treat"
          subtitle="Fresh batches, festive specials and behind-the-scenes from our Tapeswaram kitchen."
          align="center"
        />

        {/* Profile summary banner (Restored) */}
        <div className="mb-7 flex flex-col items-start gap-4 rounded-2xl border border-cream-200 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white shadow-sm">
              <InstagramIcon size={22} />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-maroon-900">
                  @bhaktanjaneyasweets.in
                </span>
              </div>
              <p className="text-xs text-ink-500">
                Traditional Andhra Sweets & Namkeen fresh from Tapeswaram
              </p>
            </div>
          </div>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-maroon-800/30 px-5 text-sm font-semibold text-maroon-800 transition-colors hover:bg-maroon-800/5 sm:w-auto"
          >
            Watch on Instagram
            <ExternalLink size={15} />
          </a>
        </div>

        {reels.length > 0 ? <ReelsCarousel reels={reels} /> : null}
      </Container>
    </section>
  );
}
