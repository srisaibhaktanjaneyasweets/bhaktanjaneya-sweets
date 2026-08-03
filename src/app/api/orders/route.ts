import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { offerFromRow, orderFromRow, orderToRow, productFromRow } from "@/lib/supabase/mappers";
import { variantLabel } from "@/lib/product";
import {
  DEFAULT_SHIPPING_SETTINGS,
  calculateShippingFee,
  type ShippingSettings,
} from "@/lib/shipping";
import type { Offer, Order, OrderItem, Product, ShippingAddress } from "@/lib/types";
import { isServiceableState } from "@/lib/constants/serviceable-areas";

/** Look up + validate a coupon against the offers table (never trust the client). */
async function validatedOffer(
  code: unknown,
  subtotal: number,
  customerPhone?: string,
  customerEmail?: string
): Promise<Offer | null> {
  if (typeof code !== "string" || !code.trim()) return null;
  const cleanCode = code.trim().toUpperCase();

  // 1. Try standard offers table first
  const { data } = await supabaseAdmin
    .from("offers")
    .select("*")
    .ilike("code", cleanCode)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (data) {
    const offer = offerFromRow(data);
    const now = new Date();
    if (offer.startsAt && new Date(offer.startsAt) > now) return null;
    if (offer.endsAt && new Date(offer.endsAt) < now) return null;
    if (offer.minSubtotal && subtotal < offer.minSubtotal) return null;
    return offer;
  }

  // 2. Try custom coupons array from settings/site_settings
  try {
    let customList: any[] = [];
    const { data: siteData } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "custom_coupons")
      .maybeSingle();

    if (siteData?.value && Array.isArray(siteData.value)) {
      customList = siteData.value;
    } else {
      const { data: setModeData } = await supabaseAdmin
        .from("settings")
        .select("value")
        .eq("key", "custom_coupons")
        .maybeSingle();
      if (setModeData?.value && Array.isArray(setModeData.value)) {
        customList = setModeData.value;
      }
    }

    const custom = customList.find((c) => c.code === cleanCode);
    if (!custom || !custom.active) return null;

    const now = new Date();
    if (custom.startsAt && new Date(custom.startsAt) > now) return null;
    if (custom.endsAt && new Date(custom.endsAt) < now) return null;
    if (custom.minSubtotal && subtotal < custom.minSubtotal) return null;

    // Check usage limits
    if (custom.usesCount !== undefined && custom.maxUses !== undefined) {
      if (custom.usesCount >= custom.maxUses) return null;
    }

    // Check phone restriction (compare last 10 digits)
    if (custom.allowedPhone) {
      const cleanCustPhone = customerPhone ? customerPhone.replace(/\D/g, "") : "";
      const cleanAllowedPhone = custom.allowedPhone.replace(/\D/g, "");
      const p1 = cleanCustPhone.slice(-10);
      const p2 = cleanAllowedPhone.slice(-10);
      if (!p1 || !p2 || p1 !== p2) return null;
    }

    // Check email restriction
    if (custom.allowedEmail) {
      const cleanCustEmail = customerEmail ? customerEmail.trim().toLowerCase() : "";
      const cleanAllowedEmail = custom.allowedEmail.trim().toLowerCase();
      if (!cleanCustEmail || cleanCustEmail !== cleanAllowedEmail) return null;
    }

    // Map custom coupon fields to standard Offer structure
    return {
      id: `custom_${custom.code}`,
      code: custom.code,
      title: custom.type === "percent" ? `${custom.value}% off` : custom.type === "flat" ? `Flat ₹${custom.value} off` : "Free Shipping",
      description: `Custom promo code ${custom.code}`,
      type: custom.type,
      value: custom.value,
      minSubtotal: custom.minSubtotal,
      active: custom.active,
      startsAt: custom.startsAt,
      endsAt: custom.endsAt,
    };
  } catch {
    return null;
  }
}

interface PricedOrder {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

/**
 * Recompute every monetary field from authoritative DB prices. The client is
 * never trusted for prices or totals — it can only choose products, variants,
 * and quantities. Returns an error string if any line can't be priced.
 */
async function priceOrder(
  rawItems: unknown,
  couponCode: unknown,
  state?: string | null,
  customerPhone?: string,
  customerEmail?: string
): Promise<PricedOrder | string> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return "Your cart is empty.";

  const ids = [...new Set(rawItems.map((it) => (it as { productId?: string })?.productId).filter(Boolean))] as string[];
  const { data, error } = await supabaseAdmin.from("products").select("*").in("id", ids);
  if (error) return error.message;

  const byId = new Map<string, Product>();
  for (const row of data ?? []) {
    const product = productFromRow(row as Record<string, unknown>);
    byId.set(product.id, product);
  }

  const items: OrderItem[] = [];
  let subtotal = 0;

  for (const raw of rawItems) {
    const it = raw as { productId?: string; variantLabel?: string; quantity?: unknown };
    const product = it.productId ? byId.get(it.productId) : undefined;
    if (!product || product.active === false) {
      return "An item in your cart is no longer available. Please review your cart and try again.";
    }
    const variant =
      product.variants.find((v) => variantLabel(v) === it.variantLabel) ??
      product.variants.find((v) => v.label === it.variantLabel);
    if (!variant) {
      return `The selected size for ${product.name} is no longer available.`;
    }

    const quantity = Math.floor(Number(it.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) return "Invalid item quantity.";

    const price = variant.price;
    subtotal += price * quantity;

    items.push({
      productId: product.id,
      name: product.name,
      variantLabel: variantLabel(variant),
      price,
      quantity,
    });
  }

  // Fetch active shipping config (try site_settings first, then settings)
  let shippingSettings = DEFAULT_SHIPPING_SETTINGS;
  try {
    const { data: siteData } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "shipping_config")
      .maybeSingle();

    if (siteData?.value) {
      shippingSettings = siteData.value as ShippingSettings;
    } else {
      const { data: setModeData } = await supabaseAdmin
        .from("settings")
        .select("value")
        .eq("key", "shipping_config")
        .maybeSingle();
      if (setModeData?.value) {
        shippingSettings = setModeData.value as ShippingSettings;
      }
    }
  } catch {}

  if (shippingSettings.minOrderValue > 0 && subtotal < shippingSettings.minOrderValue) {
    return `Minimum order subtotal is ₹${shippingSettings.minOrderValue}. Please add more items to place your order.`;
  }

  // Discount comes ONLY from a server-validated coupon — never the client value.
  const offer = await validatedOffer(couponCode, subtotal, customerPhone, customerEmail);
  let discount = 0;
  let offerFreeShipping = false;
  if (offer) {
    if (offer.type === "percent") discount = Math.round((subtotal * offer.value) / 100);
    else if (offer.type === "flat") discount = Math.min(subtotal, offer.value);
    else if (offer.type === "free_shipping") offerFreeShipping = true;
  }
  discount = Math.min(Math.max(0, discount), subtotal);
  const shipping = calculateShippingFee(subtotal, shippingSettings, offerFreeShipping, state, items);
  const total = Math.max(0, subtotal - discount + shipping);

  return { items, subtotal, shipping, discount, total };
}

function isValidAddress(address: unknown): address is ShippingAddress {
  if (!address || typeof address !== "object") return false;
  const a = address as ShippingAddress;
  return (
    typeof a.line1 === "string" &&
    a.line1.trim().length > 0 &&
    typeof a.city === "string" &&
    a.city.trim().length > 0 &&
    typeof a.state === "string" &&
    a.state.trim().length > 0 &&
    typeof a.pincode === "string" &&
    /^\d{6}$/.test(a.pincode.trim())
  );
}

export async function GET(req: Request) {
  let payload;
  try {
    payload = await requireRole(req, "customer");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }

  const phone = typeof payload.phone === "string" ? payload.phone.replace(/\D/g, "") : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  let query = supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });
  if (phone && email) {
    query = query.or(`customer_phone.eq.${phone},customer_email.eq.${email}`);
  } else if (phone) {
    query = query.eq("customer_phone", phone);
  } else if (email) {
    query = query.eq("customer_email", email);
  } else {
    return NextResponse.json([]);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((row) => orderFromRow(row)));
}

import { normalizeIndianPhone, isValidEmail } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json();
  const order = body ?? {};
  if (!order.customerPhone || !Array.isArray(order.items)) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }
  if (!order.customerName?.trim()) {
    return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
  }

  const phoneCheck = normalizeIndianPhone(String(order.customerPhone));
  if (!phoneCheck.valid) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210)." },
      { status: 400 },
    );
  }

  if (!isValidEmail(String(order.customerEmail || ""))) {
    return NextResponse.json(
      { error: "Please enter a valid email address (e.g. name@example.com)." },
      { status: 400 },
    );
  }
  if (!isValidAddress(order.shippingAddress)) {
    return NextResponse.json({ error: "Valid delivery address is required" }, { status: 400 });
  }
  // Verify state-level serviceability
  let areasMap = null;
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "serviceable_areas")
      .maybeSingle();
    if (data?.value) {
      areasMap = data.value;
    }
  } catch {}

  const isStateOk =
    order.shippingAddress.state &&
    isServiceableState(order.shippingAddress.state, areasMap);

  if (!isStateOk) {
    return NextResponse.json(
      {
        error: "We do not currently deliver to the selected state.",
      },
      { status: 400 },
    );
  }

  if (!order.paymentMethod || !["razorpay", "cod", "whatsapp"].includes(order.paymentMethod)) {
    return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
  }

  // Recompute money server-side; never trust client prices/totals.
  const priced = await priceOrder(
    order.items,
    order.couponCode,
    order.shippingAddress?.state,
    order.customerPhone,
    order.customerEmail
  );
  if (typeof priced === "string") {
    return NextResponse.json({ error: priced }, { status: 400 });
  }

  // COD orders are unpaid-on-delivery; online orders stay pending until the
  // Razorpay verification endpoint marks them paid. Never trust client status.
  const paymentMethod = order.paymentMethod as Order["paymentMethod"];
  const paymentStatus: Order["paymentStatus"] = paymentMethod === "cod" ? "cod" : "pending";

  const safeOrder: Partial<Order> = {
    customerPhone: String(order.customerPhone).replace(/\D/g, ""),
    customerName: order.customerName.trim(),
    customerEmail: order.customerEmail.trim(),
    shippingAddress: order.shippingAddress,
    notes: typeof order.notes === "string" ? order.notes.trim() || undefined : undefined,
    items: priced.items,
    subtotal: priced.subtotal,
    discount: priced.discount || undefined,
    shipping: priced.shipping,
    total: priced.total,
    channel: "online",
    paymentMethod,
    paymentStatus,
    razorpayOrderId: typeof order.razorpayOrderId === "string" ? order.razorpayOrderId : undefined,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert(orderToRow(safeOrder))
    .select("*")
    .single();

  if (error) {
    const isPolicyError =
      error.code === "42501" ||
      /row-level security|permission denied|forbidden/i.test(error.message);
    const message = isPolicyError
      ? "We couldn't save your order right now. Please try again or contact us."
      : error.message;
    return NextResponse.json({ error: message }, { status: isPolicyError ? 403 : 500 });
  }

  await supabaseAdmin.from("customers").upsert({
    phone: order.customerPhone,
    name: order.customerName ?? null,
    email: order.customerEmail ?? null,
    created_at: new Date().toISOString(),
  });

  // If a custom coupon code was used, increment its usage count in site_settings
  if (order.couponCode) {
    const cleanCoupon = String(order.couponCode).trim().toUpperCase();
    try {
      let customList: any[] = [];
      let isSiteSettings = true;
      const { data: siteData } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "custom_coupons")
        .maybeSingle();

      if (siteData?.value && Array.isArray(siteData.value)) {
        customList = siteData.value;
      } else {
        const { data: setModeData } = await supabaseAdmin
          .from("settings")
          .select("value")
          .eq("key", "custom_coupons")
          .maybeSingle();
        if (setModeData?.value && Array.isArray(setModeData.value)) {
          customList = setModeData.value;
          isSiteSettings = false;
        }
      }

      const idx = customList.findIndex((c) => c.code === cleanCoupon);
      if (idx > -1) {
        customList[idx].usesCount = (customList[idx].usesCount || 0) + 1;
        
        await supabaseAdmin
          .from(isSiteSettings ? "site_settings" : "settings")
          .upsert(
            { key: "custom_coupons", value: customList },
            { onConflict: "key" },
          );
      }
    } catch {}
  }

  return NextResponse.json(orderFromRow(data as Record<string, unknown>), { status: 201 });
}
