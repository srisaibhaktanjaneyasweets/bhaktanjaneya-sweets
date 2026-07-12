import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { orderFromRow, orderToRow } from "@/lib/supabase/mappers";

const CANCELLABLE_STATUSES = new Set(["new"]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  let payload;
  try {
    payload = await requireRole(req, "customer");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };

  if (body.action !== "cancel") {
    return NextResponse.json(
      { error: "Only order cancellation is supported for customers." },
      { status: 400 },
    );
  }

  const phone = typeof payload.phone === "string" ? payload.phone.replace(/\D/g, "") : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json(
      { error: "Order not found or you do not have access to it." },
      { status: 404 },
    );
  }

  const ownerPhone = String((existing as { customer_phone?: string }).customer_phone ?? "").replace(/\D/g, "");
  const ownerEmail = String((existing as { customer_email?: string }).customer_email ?? "").trim().toLowerCase();
  if (phone !== ownerPhone && email !== ownerEmail) {
    return NextResponse.json(
      { error: "Order not found or you do not have access to it." },
      { status: 404 },
    );
  }

  const order = orderFromRow(existing as Record<string, unknown>);

  if (order.status === "cancelled") {
    return NextResponse.json(
      { error: "This order has already been cancelled." },
      { status: 409 },
    );
  }

  if (!CANCELLABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      {
        error:
          "This order can no longer be cancelled because it has already been confirmed or is being prepared.",
        hint: "Contact us on WhatsApp if you need urgent help with this order.",
      },
      { status: 409 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update(orderToRow({ status: "cancelled" }))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(orderFromRow(data as Record<string, unknown>));
}
