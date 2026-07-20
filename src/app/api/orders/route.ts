import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { offerFromRow, orderFromRow, orderToRow, productFromRow } from "@/lib/supabase/mappers";
import { isServiceableCity } from "@/lib/constants/serviceable-areas";
import { variantLabel } from "@/lib/product";
import {
  DEFAULT_SHIPPING_SETTINGS,
  calculateShippingFee,
  type ShippingSettings,
} from "@/lib/shipping";
import type { Offer, Order, OrderItem, Product, ShippingAddress } from "@/lib/types";

/** Look up + validate a coupon against the offers table (never trust the client). */
async function validatedOffer(code: unknown, subtotal: number): Promise<Offer | null> {
  if (typeof code !== "string" || !code.trim()) return null;
  const { data } = await supabaseAdmin
    .from("offers")
    .select("*")
    .ilike("code", code.trim())
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const offer = offerFromRow(data);
  const now = new Date();
  if (offer.startsAt && new Date(offer.startsAt) > now) return null;
  if (offer.endsAt && new Date(offer.endsAt) < now) return null;
  if (offer.minSubtotal && subtotal < offer.minSubtotal) return null;
  return offer;
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
async function priceOrder(rawItems: unknown, couponCode: unknown): Promise<PricedOrder | string> {
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
  const offer = await validatedOffer(couponCode, subtotal);
  let discount = 0;
  let offerFreeShipping = false;
  if (offer) {
    if (offer.type === "percent") discount = Math.round((subtotal * offer.value) / 100);
    else if (offer.type === "flat") discount = Math.min(subtotal, offer.value);
    else if (offer.type === "free_shipping") offerFreeShipping = true;
  }
  discount = Math.min(Math.max(0, discount), subtotal);
  const shipping = calculateShippingFee(subtotal, shippingSettings, offerFreeShipping);
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
  if (!isServiceableCity(order.shippingAddress.state, order.shippingAddress.city)) {
    return NextResponse.json(
      {
        error:
          "We currently deliver only to selected cities in Andhra Pradesh & Telangana. Please contact us for cargo delivery options.",
      },
      { status: 400 },
    );
  }
  if (!order.paymentMethod || !["razorpay", "cod"].includes(order.paymentMethod)) {
    return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
  }

  // Recompute money server-side; never trust client prices/totals.
  const priced = await priceOrder(order.items, order.couponCode);
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

  return NextResponse.json(orderFromRow(data as Record<string, unknown>), { status: 201 });
}
