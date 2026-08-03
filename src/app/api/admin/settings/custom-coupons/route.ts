import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  if (!isConfigured) return NextResponse.json([]);

  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "custom_coupons")
      .maybeSingle();

    if (data?.value && Array.isArray(data.value)) {
      return NextResponse.json(data.value);
    }

    const { data: fallbackData } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "custom_coupons")
      .maybeSingle();

    if (fallbackData?.value && Array.isArray(fallbackData.value)) {
      return NextResponse.json(fallbackData.value);
    }

    return NextResponse.json([]);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
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

  const { action, coupon, code } = body;
  if (!action || !["save", "delete"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  try {
    // 1. Fetch existing list
    let list: any[] = [];
    const { data: siteData } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "custom_coupons")
      .maybeSingle();

    if (siteData?.value && Array.isArray(siteData.value)) {
      list = siteData.value;
    } else {
      const { data: setModeData } = await supabaseAdmin
        .from("settings")
        .select("value")
        .eq("key", "custom_coupons")
        .maybeSingle();
      if (setModeData?.value && Array.isArray(setModeData.value)) {
        list = setModeData.value;
      }
    }

    // 2. Perform action
    if (action === "save") {
      if (!coupon || !coupon.code) {
        return NextResponse.json({ error: "Coupon details required" }, { status: 400 });
      }
      
      const cleanCoupon = {
        code: String(coupon.code).trim().toUpperCase(),
        type: coupon.type || "percent",
        value: Number(coupon.value || 0),
        maxUses: Number(coupon.maxUses ?? 1),
        usesCount: Number(coupon.usesCount ?? 0),
        startsAt: coupon.startsAt || new Date().toISOString(),
        endsAt: coupon.endsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        allowedPhone: coupon.allowedPhone ? String(coupon.allowedPhone).trim().replace(/\D/g, "") : undefined,
        allowedEmail: coupon.allowedEmail ? String(coupon.allowedEmail).trim().toLowerCase() : undefined,
        createdAt: coupon.createdAt || new Date().toISOString(),
        active: coupon.active !== false,
      };

      const existingIndex = list.findIndex((c) => c.code === cleanCoupon.code);
      if (existingIndex > -1) {
        list[existingIndex] = {
          ...list[existingIndex],
          ...cleanCoupon,
          // Retain uses count unless explicitly reset
          usesCount: coupon.usesCount !== undefined ? cleanCoupon.usesCount : list[existingIndex].usesCount,
        };
      } else {
        list.push(cleanCoupon);
      }
    } else if (action === "delete") {
      if (!code) {
        return NextResponse.json({ error: "Code required for deletion" }, { status: 400 });
      }
      const cleanCode = String(code).trim().toUpperCase();
      list = list.filter((c) => c.code !== cleanCode);
    }

    // 3. Save back
    const { error: siteErr } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        { key: "custom_coupons", value: list },
        { onConflict: "key" },
      );

    if (!siteErr) {
      return NextResponse.json(list);
    }

    const { error: setErr } = await supabaseAdmin
      .from("settings")
      .upsert(
        { key: "custom_coupons", value: list },
        { onConflict: "key" },
      );

    if (!setErr) {
      return NextResponse.json(list);
    }

    return NextResponse.json(
      { error: `Database error: ${siteErr.message || setErr.message}` },
      { status: 500 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database error" },
      { status: 500 },
    );
  }
}
