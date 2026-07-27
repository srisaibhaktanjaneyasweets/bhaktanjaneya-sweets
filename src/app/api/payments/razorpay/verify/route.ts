import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { orderFromRow } from "@/lib/supabase/mappers";

export async function POST(req: Request) {
  const body = await req.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body ?? {};
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  if (!secret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // 1. Verify the HMAC signature with the server-only secret.
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  const sigBuf = Buffer.from(razorpay_signature);
  const expBuf = Buffer.from(expected);
  const verified = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  if (!verified) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  // 2. Confirm the captured amount with Razorpay and bind it to our order, so a
  //    valid signature for a different/insufficient payment can't mark an order
  //    paid. Payment state is set server-side only — never by the client.
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  const auth = Buffer.from(`${keyId}:${secret}`).toString("base64");
  const paymentResp = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!paymentResp.ok) {
    return NextResponse.json({ error: "Could not confirm payment with Razorpay." }, { status: 502 });
  }
  const payment = (await paymentResp.json()) as {
    status?: string;
    order_id?: string;
    amount?: number;
  };
  if (
    (payment.status !== "captured" && payment.status !== "authorized") ||
    payment.order_id !== razorpay_order_id
  ) {
    return NextResponse.json({ verified: false, error: "Payment not captured." }, { status: 400 });
  }

  // Locate our order either by its id or by the Razorpay order id we stored.
  const lookup = supabaseAdmin.from("orders").select("*");
  const { data: row, error } = orderId
    ? await lookup.eq("id", orderId).maybeSingle()
    : await lookup.eq("razorpay_order_id", razorpay_order_id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) {
    return NextResponse.json({ verified: false, error: "Order not found." }, { status: 404 });
  }

  const order = orderFromRow(row as Record<string, unknown>);
  // Razorpay amounts are in paise; our totals are rupee integers.
  if (typeof payment.amount === "number" && Math.round(payment.amount) < order.total * 100) {
    return NextResponse.json({ verified: false, error: "Amount mismatch." }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "paid",
      payment_method: "razorpay",
      razorpay_order_id,
      razorpay_payment_id,
    })
    .eq("id", order.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ verified: true });
}
