"use client";

import { useEffect, useState } from "react";
import { Megaphone, Truck, BadgePercent, MessageCircle } from "lucide-react";
import { AdminButton, Field, inputClass } from "@/components/admin/ui";
import { toast } from "@/components/ui/toast";
import { apiGet, apiPut } from "@/lib/api/client";
import {
  defaultAnnouncementMessages,
  type AnnouncementMessages,
} from "@/lib/announcement";

const FIELDS = [
  {
    key: "shipping",
    label: "Shipping message",
    hint: "Shown with the truck icon.",
    icon: Truck,
  },
  {
    key: "offer",
    label: "Offer message",
    hint: "Shown with the % icon — update this when a new offer goes live.",
    icon: BadgePercent,
  },
  {
    key: "whatsapp",
    label: "WhatsApp message",
    hint: "Shown with the chat icon.",
    icon: MessageCircle,
  },
] as const;

export default function AnnouncementsPage() {
  const [draft, setDraft] = useState<AnnouncementMessages>(defaultAnnouncementMessages());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ messages: AnnouncementMessages }>("/settings/announcement")
      .then((d) => setDraft(d.messages))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const d = await apiPut<{ messages: AnnouncementMessages }>(
        "/admin/settings/announcement",
        draft,
      );
      setDraft(d.messages);
      toast({
        tone: "success",
        title: "Announcements saved",
        message: "The header bar now shows the new messages.",
      });
    } catch (err) {
      toast({
        tone: "error",
        title: "Save failed",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900">Announcements</h1>
          <p className="text-sm text-ink-500">
            The three messages in the bar at the very top of the store.
          </p>
        </div>

        <AdminButton onClick={save} disabled={saving || loading}>
          <Megaphone size={16} /> {saving ? "Saving…" : "Save changes"}
        </AdminButton>
      </div>

      <div className="max-w-2xl space-y-4 rounded-2xl border border-cream-200 bg-white p-5">
        {FIELDS.map(({ key, label, hint, icon: Icon }) => (
          <Field key={key} label={label} hint={hint}>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-maroon-800/5 text-maroon-800">
                <Icon size={16} />
              </span>
              <input
                className={inputClass}
                value={draft[key]}
                maxLength={140}
                disabled={loading}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              />
            </div>
          </Field>
        ))}

        <p className="text-xs text-ink-400">
          Changes appear on the storefront within a minute. Leaving a message
          unchanged keeps it exactly as it is today.
        </p>
      </div>
    </div>
  );
}
