import Image from "next/image";
import { Heart, Play, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { instagramReels } from "@/lib/instagram-reels";

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

export function InstagramReels() {
  if (instagramReels.length === 0) return null;

  const instagramUrl = "https://www.instagram.com/bhaktanjaneyasweets.in/reels/";

  return (
    <section className="py-14 bg-cream-50/50 border-t border-cream-200">
      <Container>
        <SectionHeading
          eyebrow="Follow us on Instagram"
          title="Trending Reels"
        />

        {/* Profile summary banner */}
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
      </Container>

      {/* Auto-scrolling marquee of Reels */}
      <div className="marquee-group relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <ul
          className="flex w-max animate-marquee"
          style={{ ["--marquee-duration" as string]: `${Math.max(24, instagramReels.length * 10)}s` }}
        >
          {[...instagramReels, ...instagramReels].map((r, idx) => (
            <li
              key={`${r.id}-${idx}`}
              className="mr-5 w-[240px] shrink-0 sm:w-[280px]"
              aria-hidden={idx >= instagramReels.length}
            >
              <a
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-cream-200 bg-black group shadow-soft hover:shadow-md transition-shadow"
              >
                {/* Reel thumbnail */}
                <Image
                  src={r.thumbnail}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 240px, 280px"
                  className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-300"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

                {/* Central play button icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30 scale-100 group-hover:scale-110 group-hover:bg-white/30 transition-transform duration-300">
                    <Play size={20} className="fill-white translate-x-0.5" />
                  </span>
                </div>

                {/* Reel information and caption overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end pointer-events-none">
                  {/* Profile logo and username */}
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maroon-800 text-[10px] font-bold text-cream-50 border border-white/20">
                      B
                    </span>
                    <span className="text-xs font-semibold text-white truncate">
                      bhaktanjaneyasweets.in
                    </span>
                  </div>

                  {/* Caption */}
                  <p className="mt-2 text-xs leading-normal text-white/90 line-clamp-2 font-medium">
                    {r.caption}
                  </p>

                  {/* Interaction info */}
                  <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold text-white/80">
                    <span className="flex items-center gap-1">
                      <Heart size={13} className="fill-white/80 text-transparent" />
                      {r.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Play size={11} className="fill-white/80 text-transparent" />
                      {r.views} views
                    </span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
