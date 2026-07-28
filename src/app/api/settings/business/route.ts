import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { config } from "@/lib/config";

const defaultSocials = [
  { id: "instagram", name: "Instagram", url: config.social.instagram },
  { id: "facebook", name: "Facebook", url: config.social.facebook },
  { id: "youtube", name: "YouTube", url: config.social.youtube },
];

export async function GET() {
  const defaultBusiness = {
    phone: config.contact.phone,
    email: config.contact.email,
    address: config.contact.address,
    socials: defaultSocials,
  };

  if (!isConfigured) {
    return NextResponse.json(defaultBusiness);
  }

  try {
    const { data: siteData } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "business_config")
      .maybeSingle();

    if (siteData?.value) {
      return NextResponse.json(siteData.value);
    }

    // Fallback to settings table
    const { data: settingsData } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "business_config")
      .maybeSingle();

    if (settingsData?.value) {
      return NextResponse.json(settingsData.value);
    }

    return NextResponse.json(defaultBusiness);
  } catch {
    return NextResponse.json(defaultBusiness);
  }
}
