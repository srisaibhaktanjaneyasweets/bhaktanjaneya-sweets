import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import {
  defaultAnnouncementMessages,
  normalizeAnnouncementMessages,
  ANNOUNCEMENT_ROW_KEY,
  ANNOUNCEMENT_TABLE,
} from "@/lib/announcement";

/**
 * Public: current announcement-bar messages. Always succeeds — falls back to
 * the built-in defaults so the header can never break.
 */
export async function GET() {
  let messages = defaultAnnouncementMessages();

  if (isConfigured) {
    try {
      const { data } = await supabaseAdmin
        .from(ANNOUNCEMENT_TABLE)
        .select("messages")
        .eq("key", ANNOUNCEMENT_ROW_KEY)
        .maybeSingle();
      if (data && typeof data.messages === "object") {
        messages = normalizeAnnouncementMessages(data.messages as Partial<typeof messages>);
      }
    } catch {
      /* keep defaults */
    }
  }

  return NextResponse.json(
    { messages },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
