import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { DEFAULT_SHIPPING_SETTINGS, type ShippingSettings } from "@/lib/shipping";

export async function GET(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  if (!isConfigured) return NextResponse.json(DEFAULT_SHIPPING_SETTINGS);

  try {
    // 1. Try site_settings table first (standard key-value table used in production)
    const { data: siteData } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "shipping_config")
      .maybeSingle();

    if (siteData?.value) {
      return NextResponse.json(siteData.value as ShippingSettings);
    }

    // 2. Try settings table as fallback
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

export async function PUT(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  let body: ShippingSettings;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const minOrderValue = Math.max(0, Number(body.minOrderValue) || 0);
  const freeShippingThreshold = Math.max(0, Number(body.freeShippingThreshold) || 0);
  const defaultFee = Math.max(0, Number(body.defaultFee) || 0);
  const tiers = Array.isArray(body.tiers) ? body.tiers : [];

  const configToSave: ShippingSettings = {
    minOrderValue,
    freeShippingThreshold,
    defaultFee,
    tiers,
  };

  if (!isConfigured) return NextResponse.json(configToSave);

  try {
    // 1. Try site_settings first
    const { error: siteErr } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        { key: "shipping_config", value: configToSave },
        { onConflict: "key" },
      );

    if (!siteErr) {
      return NextResponse.json(configToSave);
    }

    // 2. Fallback to settings table if site_settings fails
    const { error: setErr } = await supabaseAdmin
      .from("settings")
      .upsert(
        { key: "shipping_config", value: configToSave },
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
      { error: err instanceof Error ? err.message : "Could not save shipping config" },
      { status: 500 },
    );
  }
}
