import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { DEFAULT_SERVICEABLE_AREAS } from "@/lib/constants/serviceable-areas";

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json(DEFAULT_SERVICEABLE_AREAS);
  }

  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "serviceable_areas")
      .maybeSingle();

    if (data?.value && typeof data.value === "object" && Object.keys(data.value).length > 0) {
      return NextResponse.json(data.value);
    }
  } catch {
    // Fall back to default
  }

  return NextResponse.json(DEFAULT_SERVICEABLE_AREAS);
}
