import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import {
  ANNOUNCEMENT_BUCKET,
  ANNOUNCEMENT_PATH,
  defaultAnnouncementMessages,
  normalizeAnnouncementMessages,
} from "@/lib/announcement";

/**
 * Public: current announcement-bar messages. Always succeeds — falls back to
 * the built-in defaults so the header can never break.
 */
export async function GET() {
  let messages = defaultAnnouncementMessages();

  if (isConfigured) {
    try {
      const { data } = await supabaseAdmin.storage
        .from(ANNOUNCEMENT_BUCKET)
        .download(ANNOUNCEMENT_PATH);
      if (data) {
        messages = normalizeAnnouncementMessages(JSON.parse(await data.text()));
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
