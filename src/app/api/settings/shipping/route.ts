import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { DEFAULT_SHIPPING_SETTINGS, type ShippingSettings } from "@/lib/shipping";

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json(DEFAULT_SHIPPING_SETTINGS);
  }

  try {
    // 1. Try site_settings table
    const { data: siteData } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "shipping_config")
      .maybeSingle();

    if (siteData?.value) {
      return NextResponse.json(siteData.value as ShippingSettings);
    }

    // 2. Fallback to settings table
    const { data: settingsData } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "shipping_config")
      .maybeSingle();

    if (settingsData?.value) {
      return NextResponse.json(settingsData.value as ShippingSettings);
    }

    return NextResponse.json(DEFAULT_SHIPPING_SETTINGS);
  } catch {
    return NextResponse.json(DEFAULT_SHIPPING_SETTINGS);
  }
}
