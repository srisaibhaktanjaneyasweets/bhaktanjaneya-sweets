"use client";

import Image from "next/image";
import { useState } from "react";
import { getProductImages } from "@/lib/images";
import { cn } from "@/lib/utils";
import { Play, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";

function isVideo(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("data:video/")) return true;
  const cleanSrc = src.split(/[?#]/)[0].toLowerCase();
  return (
    cleanSrc.endsWith(".mp4") ||
    cleanSrc.endsWith(".webm") ||
    cleanSrc.endsWith(".ogg") ||
    cleanSrc.endsWith(".mov") ||
    cleanSrc.endsWith(".m4v")
  );
}

export function ProductGallery({
  images,
  name,
  category,
}: {
  images: string[];
  name: string;
  category: string;
}) {
  const imgs = getProductImages({ images, category });
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const prevMedia = () => {
    setActive((prev) => (prev - 1 + imgs.length) % imgs.length);
  };

  const nextMedia = () => {
    setActive((prev) => (prev + 1) % imgs.length);
  };

  return (
    <div>
      {/* Main Active Media view */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-cream-200 bg-cream-100 flex items-center justify-center group">
        {isVideo(imgs[active]) ? (
          <video
            src={imgs[active]}
            controls
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted
          />
        ) : (
          <Image
            src={imgs[active]}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        )}

        {/* Magnifying Glass Zoom Icon (Top-Left) */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Zoom image details and different angles"
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md border border-cream-200 text-maroon-850 hover:bg-cream-100 hover:scale-105 active:scale-95 transition-all"
        >
          <ZoomIn size={20} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Thumbnails grid */}
      {imgs.length > 1 && (
        <div className="mt-4 flex flex-wrap items-start gap-4">
          {imgs.map((src, i) => {
            const isVid = isVideo(src);
            return (
              <div key={src + i} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View ${isVid ? "video" : "image"} ${i + 1}`}
                  className={cn(
                    "relative h-16 w-16 overflow-hidden rounded-xl border bg-cream-100 transition-all flex items-center justify-center cursor-pointer",
                    i === active
                      ? "border-maroon-800 ring-2 ring-maroon-800/10 scale-105"
                      : "border-cream-200 hover:border-maroon-300",
                  )}
                >
                  {isVid ? (
                    <>
                      <video src={src} className="absolute inset-0 w-full h-full object-cover" muted />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/20 backdrop-blur-sm">
                          <Play size={16} className="translate-x-0.5 fill-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                  )}
                </button>
                {isVid && (
                  <span className="mt-1 text-[10px] font-bold tracking-wider text-ink-500 uppercase">
                    VIDEO
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Zoom Modal (Full Screen) */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm animate-fade-in">
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close zoom view"
            className="absolute right-4 top-4 z-55 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
          >
            <X size={28} />
          </button>

          {/* Slider Content Wrapper */}
          <div className="relative flex w-full max-w-4xl flex-1 items-center justify-center">
            {/* Left Nav Arrow */}
            {imgs.length > 1 && (
              <button
                type="button"
                onClick={prevMedia}
                aria-label="Previous image"
                className="absolute left-2 sm:-left-16 z-55 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {/* Main Media Player */}
            <div className="relative max-h-[70vh] w-full max-w-3xl aspect-square overflow-hidden rounded-2xl flex items-center justify-center bg-zinc-900/50 border border-white/5">
              {isVideo(imgs[active]) ? (
                <video
                  src={imgs[active]}
                  controls
                  className="max-h-[70vh] max-w-full object-contain"
                  playsInline
                  autoPlay
                  muted
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={imgs[active]}
                    alt={name}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                  />
                </div>
              )}
            </div>

            {/* Right Nav Arrow */}
            {imgs.length > 1 && (
              <button
                type="button"
                onClick={nextMedia}
                aria-label="Next image"
                className="absolute right-2 sm:-right-16 z-55 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {imgs.length > 1 && (
            <div className="mt-6 flex justify-center gap-3 overflow-x-auto max-w-full p-2">
              {imgs.map((src, i) => {
                const isVid = isVideo(src);
                return (
                  <button
                    key={"modal-" + src + i}
                    type="button"
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative h-16 w-16 overflow-hidden rounded-lg border bg-zinc-800 flex items-center justify-center shrink-0 transition-all",
                      i === active ? "border-white ring-2 ring-white/20" : "border-white/20 opacity-60 hover:opacity-100",
                    )}
                  >
                    {isVid ? (
                      <>
                        <video src={src} className="absolute inset-0 w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                          <Play size={16} fill="currentColor" />
                        </div>
                      </>
                    ) : (
                      <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
