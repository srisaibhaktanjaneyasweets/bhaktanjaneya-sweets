import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import {
  OFFER_BANNER_ROW_KEY,
  OFFER_BANNER_TABLE,
  normalizeOfferBannerSettings,
  type OfferBannerSettings,
} from "@/lib/offer-banner";

export async function PUT(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await req.json()) as Partial<OfferBannerSettings>;
  const settings = normalizeOfferBannerSettings(body);

  if (!isConfigured) {
    return NextResponse.json({ settings });
  }

  const { error } = await supabaseAdmin
    .from(OFFER_BANNER_TABLE)
    .upsert({ key: OFFER_BANNER_ROW_KEY, messages: settings }, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings });
}
