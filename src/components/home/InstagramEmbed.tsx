import Image from "next/image";
import { ExternalLink, Play } from "lucide-react";

const REEL_URL =
  "https://www.instagram.com/reel/DV3fc6_Tqcc/?utm_source=ig_web_button_share_sheet&igsh=MzRlODBiNWFlZA==";

export function InstagramEmbed() {
  return (
    <a
      href={REEL_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Watch our Instagram reel"
      className="group mx-auto block max-w-[360px] overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold-400/60 hover:shadow-card"
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-maroon-900">
        <Image
          src="/images/instagram-reel-DV3fc6_Tqcc.jpg"
          alt="A selection of Bhaktanjaneya Sweets gift packs from our Instagram reel"
          fill
          sizes="(max-width: 360px) 100vw, 360px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/80 via-transparent to-black/10" />

        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-maroon-900 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600" />
          @bhaktanjaneyasweets.in
        </span>

        <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 pl-1 text-maroon-800 shadow-lg transition-transform duration-300 group-hover:scale-110">
          <Play size={28} fill="currentColor" aria-hidden="true" />
        </span>

        <div className="absolute inset-x-0 bottom-0 p-5 text-cream-50 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
            Fresh from Tapeswaram
          </p>
          <p className="mt-1 text-xl font-bold">Watch our latest reel</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-maroon-900 transition-colors group-hover:bg-gold-400">
            Watch on Instagram
            <ExternalLink size={15} aria-hidden="true" />
          </span>
        </div>
      </div>
    </a>
  );
}
