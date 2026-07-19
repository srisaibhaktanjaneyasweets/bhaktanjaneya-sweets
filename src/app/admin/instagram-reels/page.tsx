"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Film,
  Plus,
  Save,
  Trash2,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { AdminButton, inputClass } from "@/components/admin/ui";
import { toast } from "@/components/ui/toast";
import { apiGet, apiPut } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export interface ReelItem {
  id?: string;
  url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  position?: number;
}

interface ReelsResponse {
  reels: Array<ReelItem | string>;
}

function isValidReelUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    return (
      parsed.protocol === "https:" &&
      (host === "instagram.com" || host === "www.instagram.com") &&
      parsed.pathname.startsWith("/reel/")
    );
  } catch {
    return false;
  }
}

function InstagramIcon({ className, size = 20 }: { className?: string; size?: number }) {
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

export default function InstagramReelsAdminPage() {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<ReelsResponse>("/admin/settings/instagram-reels")
      .then((data) => {
        const parsed: ReelItem[] = (data.reels ?? []).map((item) =>
          typeof item === "string" ? { url: item } : item,
        );
        setReels(parsed);
      })
      .catch(() => {
        // Fall back to public endpoint if admin GET is unavailable
        apiGet<ReelsResponse>("/settings/instagram-reels")
          .then((data) => {
            const parsed: ReelItem[] = (data.reels ?? []).map((item) =>
              typeof item === "string" ? { url: item } : item,
            );
            setReels(parsed);
          })
          .catch(() => {
            toast({
              tone: "error",
              title: "Could not load reels",
              message: "Please refresh the page and try again.",
            });
          });
      })
      .finally(() => setLoading(false));
  }, []);

  function handleAddReel(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setUrlError("");
    const trimmed = newUrl.trim();
    if (!trimmed) {
      setUrlError("Please paste an Instagram reel link.");
      return;
    }
    if (!isValidReelUrl(trimmed)) {
      setUrlError("Invalid reel URL. Link must start with https://www.instagram.com/reel/...");
      return;
    }
    if (reels.some((r) => r.url === trimmed)) {
      setUrlError("This reel link is already in your showcase list.");
      return;
    }
    if (reels.length >= 12) {
      setUrlError("Maximum of 12 reels allowed in the showcase.");
      return;
    }

    setReels((prev) => [...prev, { url: trimmed }]);
    setNewUrl("");
    toast({
      tone: "success",
      title: "Reel added to list",
      message: "Click 'Save Changes' to download its cover thumbnail and publish it.",
    });
  }

  function handleRemove(index: number) {
    setReels((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMove(index: number, direction: "left" | "right") {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reels.length) return;

    setReels((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  }

  function handleUrlChange(index: number, value: string) {
    setReels((prev) =>
      prev.map((r, i) => (i === index ? { ...r, url: value } : r)),
    );
  }

  async function save() {
    setSaving(true);
    setUrlError("");
    try {
      const validUrls = reels.map((r) => r.url.trim()).filter((url) => url.length > 0);
      const data = await apiPut<ReelsResponse>("/admin/settings/instagram-reels", {
        reels: validUrls,
      });

      const parsed: ReelItem[] = (data.reels ?? []).map((item) =>
        typeof item === "string" ? { url: item } : item,
      );
      setReels(parsed);

      toast({
        tone: "success",
        title: "Reels showcase updated!",
        message: "Thumbnails were stored and updated on your storefront homepage.",
      });
    } catch (error) {
      toast({
        tone: "error",
        title: "Save failed",
        message: error instanceof Error ? error.message : "Could not save Instagram reels.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Top Page Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-cream-200 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white shadow-sm">
              <InstagramIcon size={20} />
            </span>
            <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">
              Instagram Reels Showcase
            </h1>
          </div>
          <p className="text-sm text-ink-500">
            Manage the video reels featured on your storefront homepage. Thumbnails are automatically cached.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-cream-300 bg-cream-50 px-4 text-xs font-semibold text-maroon-800 transition-colors hover:bg-cream-100"
          >
            <ExternalLink size={14} /> Storefront Preview
          </Link>

          <AdminButton
            onClick={save}
            disabled={saving || loading}
            className="h-11 rounded-full px-6 font-semibold shadow-md"
          >
            <Save size={16} /> {saving ? "Saving & Processing…" : "Save Changes"}
          </AdminButton>
        </div>
      </div>

      {/* Add New Reel Card Bar */}
      <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-soft">
        <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-maroon-900">
          <Plus size={18} className="text-saffron-600" />
          Add New Instagram Reel
        </h2>
        <p className="mt-0.5 text-xs text-ink-500">
          Paste a public Instagram reel URL below (e.g., <span className="font-mono text-ink-700">https://www.instagram.com/reel/DV3fc6_Tqcc/</span>).
        </p>

        <form onSubmit={handleAddReel} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                if (urlError) setUrlError("");
              }}
              placeholder="https://www.instagram.com/reel/..."
              className={cn(
                inputClass,
                "h-12 w-full pr-10",
                urlError && "border-maroon-600 focus:border-maroon-600 focus:ring-maroon-600/30",
              )}
            />
            {newUrl && isValidReelUrl(newUrl) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-leaf-600">
                <CheckCircle2 size={18} />
              </span>
            )}
          </div>

          <AdminButton
            type="submit"
            disabled={loading || !newUrl.trim()}
            className="h-12 shrink-0 rounded-xl px-6 font-semibold"
          >
            <Plus size={18} /> Add Reel
          </AdminButton>
        </form>

        {urlError && (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-maroon-700">
            <AlertCircle size={14} /> {urlError}
          </p>
        )}
      </div>

      {/* Main Reels Grid Container */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-2 px-1 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-maroon-900">
              Active Showcase Grid
            </h2>
            <span className="rounded-full bg-saffron-500/20 px-2.5 py-0.5 text-xs font-bold text-maroon-900">
              {reels.length} / 12 slots
            </span>
          </div>
          <span className="text-xs text-ink-400">
            Reorder cards using arrows to change display position on the homepage carousel.
          </span>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-cream-200 bg-cream-100"
              />
            ))}
          </div>
        ) : reels.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-cream-300 bg-white py-16 px-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-maroon-800">
              <Film size={28} />
            </span>
            <h3 className="mt-4 font-serif text-lg font-semibold text-maroon-900">
              No Instagram Reels Configured
            </h3>
            <p className="mt-1 max-w-sm text-xs text-ink-500">
              Paste an Instagram reel URL in the box above to add your first video to the homepage carousel.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reels.map((reel, idx) => {
              const isSaved = Boolean(reel.thumbnail_url);
              const caption = reel.caption ?? "";
              const isValid = isValidReelUrl(reel.url);

              return (
                <div
                  key={reel.id || `${reel.url}-${idx}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-soft transition duration-300 hover:border-gold-400/60 hover:shadow-card"
                >
                  {/* Aspect Ratio 9/16 Card Cover */}
                  <div className="relative aspect-[9/16] w-full overflow-hidden bg-maroon-950">
                    {reel.thumbnail_url ? (
                      <Image
                        src={reel.thumbnail_url}
                        alt={caption || `Reel ${idx + 1}`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-cream-100/70">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-saffron-400 backdrop-blur-sm">
                          <Film size={28} />
                        </span>
                        <p className="mt-3 text-xs font-semibold text-cream-50">
                          {isSaved ? "Cover Available" : "New Reel Pending Save"}
                        </p>
                        <p className="mt-1 text-[11px] text-cream-100/60">
                          Save changes to download thumbnail
                        </p>
                      </div>
                    )}

                    {/* Gradient Overlay for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                    {/* Top Position Tag */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-maroon-900 shadow-sm backdrop-blur-sm">
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-maroon-800 text-[10px] font-bold text-white leading-none">
                        {idx + 1}
                      </span>
                      Reel #{idx + 1}
                    </div>

                    {/* Top Right Saved Status Indicator */}
                    <div className="absolute top-3 right-3 z-10">
                      {isSaved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-leaf-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-saffron-500 px-2.5 py-1 text-[10px] font-bold text-maroon-955 shadow-sm">
                          <Clock size={12} /> Unsaved
                        </span>
                      )}
                    </div>

                    {/* Center Play Icon Hover Effect */}
                    <a
                      href={reel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-10 flex items-center justify-center opacity-85 transition-opacity group-hover:opacity-100"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-maroon-905 shadow-lg transition-transform duration-300 group-hover:scale-110">
                        <Play size={24} fill="currentColor" className="ml-0.5" />
                      </span>
                    </a>

                    {/* Bottom Caption Overlay */}
                    <div className="absolute inset-x-0 bottom-0 z-10 p-3.5 pt-8 bg-gradient-to-t from-black/95 to-transparent">
                      <p className="line-clamp-2 text-xs font-medium text-white/90">
                        {caption || "No caption cached yet."}
                      </p>
                    </div>
                  </div>

                  {/* Card Controls Footer */}
                  <div className="flex flex-col gap-2.5 p-3.5 bg-white border-t border-cream-200">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={reel.url}
                        onChange={(e) => handleUrlChange(idx, e.target.value)}
                        className={cn(
                          inputClass,
                          "h-9 text-xs flex-1",
                          !isValid && "border-maroon-600 text-maroon-700",
                        )}
                        placeholder="https://www.instagram.com/reel/..."
                      />
                      <a
                        href={reel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View on Instagram"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cream-300 text-maroon-800 transition-colors hover:bg-cream-100"
                      >
                        <ExternalLink size={15} />
                      </a>
                    </div>

                    {/* Reordering and Delete Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, "left")}
                          title="Move earlier"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-300 text-maroon-800 transition-colors hover:bg-cream-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === reels.length - 1}
                          onClick={() => handleMove(idx, "right")}
                          title="Move later"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-300 text-maroon-800 transition-colors hover:bg-cream-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-maroon-700 hover:bg-maroon-800/10 transition-colors"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Helpful Tips Card */}
      <div className="rounded-3xl border border-cream-200 bg-cream-100/60 p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-600">
            <HelpCircle size={18} />
          </span>
          <div className="text-xs text-ink-600 space-y-1.5">
            <h4 className="font-serif text-sm font-bold text-maroon-900">
              Tips for Best Results
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Public Accounts Only:</strong> Ensure your reels are from public Instagram posts so cover images and metadata can be fetched seamlessly.
              </li>
              <li>
                <strong>Auto-Caching:</strong> When you click <strong>Save Changes</strong>, cover images are downloaded and stored securely in Supabase Storage.
              </li>
              <li>
                <strong>Display Limit:</strong> Up to 12 reels are displayed on your homepage in an interactive carousel with autoplay.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
