"use client";

import { useEffect, useState } from "react";
import { Film, Plus, Save, Trash2 } from "lucide-react";
import { AdminButton, inputClass } from "@/components/admin/ui";
import { toast } from "@/components/ui/toast";
import { apiGet, apiPut } from "@/lib/api/client";

interface ReelsResponse {
  reels: string[];
}

export default function InstagramReelsAdminPage() {
  const [reels, setReels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<ReelsResponse>("/settings/instagram-reels")
      .then((data) => setReels(data.reels))
      .catch(() => toast({ tone: "error", title: "Could not load reels", message: "Please refresh and try again." }))
      .finally(() => setLoading(false));
  }, []);

  function updateReel(index: number, value: string) {
    setReels((current) => current.map((reel, i) => (i === index ? value : reel)));
  }

  async function save() {
    setSaving(true);
    try {
      const data = await apiPut<ReelsResponse>("/admin/settings/instagram-reels", {
        reels: reels.filter((reel) => reel.trim()),
      });
      setReels(data.reels);
      toast({
        tone: "success",
        title: "Reels saved",
        message: "Their thumbnails will refresh automatically on the storefront.",
      });
    } catch (error) {
      toast({
        tone: "error",
        title: "Save failed",
        message: error instanceof Error ? error.message : "Please check the links and try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900">Instagram reels</h1>
          <p className="mt-1 text-sm text-ink-500">
            Add public Instagram reel links. The storefront automatically fetches each reel’s current thumbnail.
          </p>
        </div>
        <AdminButton onClick={save} disabled={saving || loading}>
          <Save size={16} /> {saving ? "Saving…" : "Save reels"}
        </AdminButton>
      </div>

      <div className="space-y-3 rounded-2xl border border-cream-200 bg-white p-5 shadow-soft">
        {reels.map((reel, index) => (
          <div key={`${index}-${reel}`} className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-maroon-800/5 text-maroon-800">
              <Film size={17} />
            </span>
            <input
              type="url"
              className={inputClass}
              value={reel}
              disabled={loading}
              placeholder="https://www.instagram.com/reel/..."
              onChange={(event) => updateReel(index, event.target.value)}
            />
            <AdminButton
              variant="danger"
              aria-label={`Remove reel ${index + 1}`}
              disabled={loading}
              onClick={() => setReels((current) => current.filter((_, i) => i !== index))}
              className="w-10 shrink-0 px-0"
            >
              <Trash2 size={16} />
            </AdminButton>
          </div>
        ))}

        {reels.length < 12 ? (
          <AdminButton
            variant="ghost"
            disabled={loading}
            onClick={() => setReels((current) => [...current, ""])}
          >
            <Plus size={16} /> Add reel
          </AdminButton>
        ) : null}

        <p className="pt-1 text-xs text-ink-400">
          Add up to 12 links. Use the full public URL in the format https://www.instagram.com/reel/… . Changes appear on the storefront within about a minute.
        </p>
      </div>
    </div>
  );
}
