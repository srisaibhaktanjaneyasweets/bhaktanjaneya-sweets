import { config } from "@/lib/config";
import { formatINR } from "@/lib/utils";

/**
 * Announcement-bar messages shown in the site header. Editable from the admin
 * panel (Announcements page); stored as a small JSON document in Supabase
 * Storage so no database schema changes are needed. These defaults are used
 * whenever nothing has been saved yet or storage is unreachable.
 */
export interface AnnouncementMessages {
  shipping: string;
  offer: string;
  whatsapp: string;
}

export const ANNOUNCEMENT_BUCKET = "site-content";
export const ANNOUNCEMENT_PATH = "announcement.json";

export function defaultAnnouncementMessages(): AnnouncementMessages {
  return {
    shipping: `Free shipping on orders over ${formatINR(config.freeShippingThreshold)}`,
    offer: "Use code BAS10 for 10% off your first order",
    whatsapp: `Order on WhatsApp: ${config.contact.phone}`,
  };
}

/** Merge stored values over defaults, ignoring blank/missing fields. */
export function normalizeAnnouncementMessages(
  raw: Partial<AnnouncementMessages> | null | undefined,
): AnnouncementMessages {
  const base = defaultAnnouncementMessages();
  if (!raw) return base;
  const pick = (v: unknown, fallback: string) =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;
  return {
    shipping: pick(raw.shipping, base.shipping),
    offer: pick(raw.offer, base.offer),
    whatsapp: pick(raw.whatsapp, base.whatsapp),
  };
}
