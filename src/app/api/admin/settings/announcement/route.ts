import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import {
  ANNOUNCEMENT_ROW_KEY,
  ANNOUNCEMENT_TABLE,
  normalizeAnnouncementMessages,
  type AnnouncementMessages,
} from "@/lib/announcement";

const MAX_LENGTH = 140;

/** Admin: save the three announcement-bar messages. */
export async function PUT(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await req.json()) as Partial<AnnouncementMessages>;
  for (const key of ["shipping", "offer", "whatsapp"] as const) {
    const value = body[key];
    if (typeof value !== "string" || !value.trim()) {
      return NextResponse.json({ error: `The ${key} message cannot be empty.` }, { status: 400 });
    }
    if (value.trim().length > MAX_LENGTH) {
      return NextResponse.json(
        { error: `The ${key} message must be under ${MAX_LENGTH} characters.` },
        { status: 400 },
      );
    }
  }

  const messages = normalizeAnnouncementMessages(body);

  if (!isConfigured) {
    return NextResponse.json({ messages });
  }

  const { error } = await supabaseAdmin
    .from(ANNOUNCEMENT_TABLE)
    .upsert({ key: ANNOUNCEMENT_ROW_KEY, messages }, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages });
}
