export const dynamic = "force-dynamic";
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

  const defaultShipmentTemplate = `*🎉 Great news! Your order has been shipped!*

Hello {{customerName}},
We have shipped your order *#{{orderId}}* from *{{businessName}}*! Here are your shipping details:

--------------------------------
{{detailsBlock}}
--------------------------------

🗓️ *Estimated Delivery:* 3-4 business days.
📞 If you do not receive it within this time, please contact us at *{{contactPhone}}*.

⚠️ *CRITICAL: BOX OPENING INSTRUCTIONS*
Please record a *continuous video of opening the box* without any cuts, edits, or pauses. This video is *compulsory* to claim a refund or replacement in case of damages or missing items.

Thank you for ordering traditional pure ghee sweets from us! We hope you love them! ✨`;

  const defaultDeliveryTemplate = `*🎉 Sweets Delivered! Hope you love them!* 🎁

Hello {{customerName}},
Your order *#{{orderId}}* from *{{businessName}}* has been successfully delivered! We hope you enjoy our traditional, pure ghee sweets and crunchy namkeens.

If you loved our products, we would be thrilled if you shared the joy!
*Post a story on Instagram* tagging us *@bhaktanjaneyasweets.in* and adding our website link: {{siteUrl}}

As a token of our appreciation, we'll send you:
🎁 A *complimentary sweet* on your next order
*OR*
🎟️ A *5% discount coupon* for your next online purchase!

Thank you so much for choosing us. We look forward to serving you again soon! ✨`;

  const defaultBusiness = {
    phone: config.contact.phone,
    email: config.contact.email,
    address: config.contact.address,
    socials: defaultSocials,
    whatsappShipmentTemplate: defaultShipmentTemplate,
    whatsappDeliveryTemplate: defaultDeliveryTemplate,
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
  const whatsappShipmentTemplate = String(body.whatsappShipmentTemplate || "");
  const whatsappDeliveryTemplate = String(body.whatsappDeliveryTemplate || "");

  const configToSave = {
    phone,
    email,
    address,
    socials: socials.map((s: any) => ({
      id: String(s.id || "").trim() || `social-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: String(s.name || "").trim(),
      url: String(s.url || "").trim(),
    })).filter((s: { name: string; url: string }) => s.name && s.url),
    whatsappShipmentTemplate,
    whatsappDeliveryTemplate,
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

