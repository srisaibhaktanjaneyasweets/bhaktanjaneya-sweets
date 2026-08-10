import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { orderFromRow } from "@/lib/supabase/mappers";

function cleanAndNormalizeId(input: string): string {
  return input.trim().toLowerCase().replace(/^ord_?/, "").replace(/^#/, "");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const { id } = await params;
  const cleanId = cleanAndNormalizeId(id);

  if (!cleanId || cleanId.length < 6) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  let query = supabaseAdmin.from("orders").select("*");

  if (cleanId.length === 36) {
    query = query.eq("id", cleanId);
  } else {
    query = query.like("id", `${cleanId}%`);
  }

  const { data, error } = await query.maybeSingle();

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
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    items: order.items,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddress,
  });
}

