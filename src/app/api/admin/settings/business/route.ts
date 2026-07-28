import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { config } from "@/lib/config";

const defaultSocials = [
  { id: "instagram", name: "Instagram", url: config.social.instagram },
  { id: "facebook", name: "Facebook", url: config.social.facebook },
  { id: "youtube", name: "YouTube", url: config.social.youtube },
];

export async function GET(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  const defaultBusiness = {
    phone: config.contact.phone,
    email: config.contact.email,
    address: config.contact.address,
    socials: defaultSocials,
  };

  if (!isConfigured) return NextResponse.json(defaultBusiness);

  try {
    const { data: siteData } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "business_config")
      .maybeSingle();

    if (siteData?.value) {
      return NextResponse.json(siteData.value);
    }

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

export async function PUT(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const address = String(body.address || "").trim();
  const socials = Array.isArray(body.socials) ? body.socials : [];

  const configToSave = {
    phone,
    email,
    address,
    socials: socials.map((s: any) => ({
      id: String(s.id || "").trim() || `social-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: String(s.name || "").trim(),
      url: String(s.url || "").trim(),
    })).filter((s: { name: string; url: string }) => s.name && s.url),
  };

  if (!isConfigured) return NextResponse.json(configToSave);

  try {
    // 1. Try site_settings first
    const { error: siteErr } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        { key: "business_config", value: configToSave },
        { onConflict: "key" },
      );

    if (!siteErr) {
      return NextResponse.json(configToSave);
    }

    // 2. Fallback to settings table
    const { error: setErr } = await supabaseAdmin
      .from("settings")
      .upsert(
        { key: "business_config", value: configToSave },
        { onConflict: "key" },
      );

    if (!setErr) {
      return NextResponse.json(configToSave);
    }

    return NextResponse.json(
      { error: `Database error: ${siteErr.message || setErr.message}` },
      { status: 500 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save business config" },
      { status: 500 },
    );
  }
}
