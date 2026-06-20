import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { orderFromRow } from "@/lib/supabase/mappers";

function normalizeOrderId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  // Admin UI renders order id as ord_<raw>. For lookup we accept either:
  //  - ord_XXXXXXXX
  //  - XXXXXXXX
  const upper = trimmed.toUpperCase();
  if (upper.startsWith("ORD_")) return upper;
  if (upper.startsWith("ORD")) return `ord_${upper.replace(/^ORD_?/i, "")}`;
  return `ord_${upper}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const { id } = await params;
  const orderId = normalizeOrderId(id);

  if (!orderId || orderId.length < 6) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  // Require the order's phone too, so an order id alone can't be looked up and a
  // phone number alone can't be enumerated — both must match the same order.
  const phone = (new URL(req.url).searchParams.get("phone") ?? "").replace(/\D/g, "");
  if (!phone || phone.length < 8) {
    return NextResponse.json(
      { error: "Enter the phone number used for the order." },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("customer_phone", phone)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = orderFromRow(data as Record<string, unknown>);

  // Public lookup should not leak anything extra beyond what the customer-facing
  // order status page needs.
  return NextResponse.json({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    deliveryCompany: order.deliveryCompany,
    deliveryTrackingId: order.deliveryTrackingId,
    total: order.total,
    items: order.items,
  });
}

