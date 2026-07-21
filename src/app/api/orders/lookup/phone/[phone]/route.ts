import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { orderFromRow } from "@/lib/supabase/mappers";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

type PublicOrderLookupResponse = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: Order["paymentMethod"];
  deliveryCompany?: string;
  deliveryTrackingId?: string;
  total: number;
  items: Order["items"];
};

function normalizePhoneVariants(input: string): string[] {
  const digitsOnly = input.trim().replace(/\D/g, "");
  if (!digitsOnly) return [];

  const variants = new Set<string>();
  variants.add(digitsOnly);
  variants.add(`+${digitsOnly}`);

  if (digitsOnly.length === 10) {
    variants.add(`91${digitsOnly}`);
    variants.add(`+91${digitsOnly}`);
    variants.add(`0${digitsOnly}`);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    const raw10 = digitsOnly.slice(2);
    variants.add(raw10);
    variants.add(`+91${raw10}`);
    variants.add(`0${raw10}`);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    const raw10 = digitsOnly.slice(1);
    variants.add(raw10);
    variants.add(`91${raw10}`);
    variants.add(`+91${raw10}`);
  }

  return Array.from(variants);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ phone: string }> | { phone: string } },
) {
  const { phone } = await params;
  const variants = normalizePhoneVariants(phone);

  if (variants.length === 0) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  // Fetch ALL matching orders for this phone number (up to 50, sorted newest first)
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .in("customer_phone", variants)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No orders found for this phone number" }, { status: 404 });
  }

  const publicOrders: PublicOrderLookupResponse[] = data.map((row) => {
    const order = orderFromRow(row as Record<string, unknown>);
    return {
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      deliveryCompany: order.deliveryCompany,
      deliveryTrackingId: order.deliveryTrackingId,
      total: order.total,
      items: order.items,
    };
  });

  return NextResponse.json(publicOrders);
}
