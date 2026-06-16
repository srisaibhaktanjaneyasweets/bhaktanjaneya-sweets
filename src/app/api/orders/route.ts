import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { orderFromRow, orderToRow } from "@/lib/supabase/mappers";
import { isServiceableCity } from "@/lib/constants/serviceable-areas";
import type { Order, ShippingAddress } from "@/lib/types";

function toDbOrder(body: Record<string, unknown>) {
  return orderToRow({
    ...(body as Partial<Order>),
    createdAt: new Date().toISOString(),
  });
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
    payload = requireRole(req, "customer");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("customer_phone", payload.phone ?? payload.sub)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((row) => orderFromRow(row)));
}

export async function POST(req: Request) {
  const body = await req.json();
  const order = body ?? {};
  if (!order.customerPhone || !Array.isArray(order.items)) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }
  if (!order.customerName?.trim()) {
    return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
  }
  if (!order.customerEmail?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
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

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert(toDbOrder(order))
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
