import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
  error_code?: string;
  error_description?: string;
}

interface RazorpayOrderEntity {
  id: string;
  amount: number;
  amount_paid: number;
  status: string;
  notes?: Record<string, string>;
}

interface RazorpayRefundEntity {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
}

interface RazorpayWebhookPayload {
  entity: string;
  event: string;
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    order?: {
      entity: RazorpayOrderEntity;
    };
    refund?: {
      entity: RazorpayRefundEntity;
    };
  };
}

export async function POST(req: Request) {
  const secret =
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    "";
  if (!secret) {
    return NextResponse.json(
      { error: "RAZORPAY_WEBHOOK_SECRET is not configured." },
      { status: 500 },
    );
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  // 1. Verify HMAC SHA256 signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  const isVerified =
    sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

  if (!isVerified) {
    console.warn("Razorpay Webhook Warning: Invalid signature or secret mismatch.");
    return NextResponse.json(
      {
        success: false,
        message: "Webhook received, but signature mismatch. Check RAZORPAY_WEBHOOK_SECRET environment variable.",
      },
      { status: 200 },
    );
  }

  // 2. Parse event payload
  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventName = body.event;

  try {
    if (eventName === "payment.captured") {
      const payment = body.payload?.payment?.entity;
      if (!payment) {
        return NextResponse.json({ error: "Missing payment entity" }, { status: 400 });
      }

      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;
      const customOrderId = payment.notes?.orderId;

      let query = supabaseAdmin.from("orders").select("id, status");
      if (customOrderId) {
        query = query.or(`id.eq.${customOrderId},razorpay_order_id.eq.${razorpayOrderId}`);
      } else {
        query = query.eq("razorpay_order_id", razorpayOrderId);
      }

      const { data: rows, error: selectError } = await query;
      if (selectError) {
        return NextResponse.json({ error: selectError.message }, { status: 500 });
      }

      const orderRow = rows?.[0];
      if (!orderRow) {
        return NextResponse.json(
          { message: "Webhook received, but order not found." },
          { status: 200 },
        );
      }

      const nextStatus = orderRow.status === "pending" ? "confirmed" : orderRow.status;
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          status: nextStatus,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
        })
        .eq("id", orderRow.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Order ${orderRow.id} paid.` });
    }

    if (eventName === "payment.failed") {
      const payment = body.payload?.payment?.entity;
      if (payment) {
        const razorpayOrderId = payment.order_id;
        const customOrderId = payment.notes?.orderId;

        let query = supabaseAdmin.from("orders").select("id");
        if (customOrderId) {
          query = query.or(`id.eq.${customOrderId},razorpay_order_id.eq.${razorpayOrderId}`);
        } else {
          query = query.eq("razorpay_order_id", razorpayOrderId);
        }

        const { data: rows } = await query;
        if (rows?.[0]) {
          await supabaseAdmin
            .from("orders")
            .update({
              payment_status: "failed",
              razorpay_payment_id: payment.id,
            })
            .eq("id", rows[0].id);
        }
      }

      return NextResponse.json({ success: true, message: "Payment failure recorded." });
    }

    if (eventName === "order.paid") {
      const order = body.payload?.order?.entity;
      if (order) {
        const razorpayOrderId = order.id;
        const customOrderId = order.notes?.orderId;

        let query = supabaseAdmin.from("orders").select("id, status");
        if (customOrderId) {
          query = query.or(`id.eq.${customOrderId},razorpay_order_id.eq.${razorpayOrderId}`);
        } else {
          query = query.eq("razorpay_order_id", razorpayOrderId);
        }

        const { data: rows } = await query;
        if (rows?.[0]) {
          const nextStatus = rows[0].status === "pending" ? "confirmed" : rows[0].status;
          await supabaseAdmin
            .from("orders")
            .update({
              payment_status: "paid",
              status: nextStatus,
              razorpay_order_id: razorpayOrderId,
            })
            .eq("id", rows[0].id);
        }
      }

      return NextResponse.json({ success: true, message: "Order paid event processed." });
    }

    if (eventName === "refund.processed") {
      const refund = body.payload?.refund?.entity;
      const payment = body.payload?.payment?.entity;
      const razorpayPaymentId = refund?.payment_id || payment?.id;
      const razorpayOrderId = payment?.order_id;
      const customOrderId = refund?.notes?.orderId || payment?.notes?.orderId;

      if (razorpayPaymentId || razorpayOrderId || customOrderId) {
        let query = supabaseAdmin.from("orders").select("id, status");
        if (customOrderId) {
          query = query.or(`id.eq.${customOrderId},razorpay_order_id.eq.${razorpayOrderId},razorpay_payment_id.eq.${razorpayPaymentId}`);
        } else if (razorpayOrderId && razorpayPaymentId) {
          query = query.or(`razorpay_order_id.eq.${razorpayOrderId},razorpay_payment_id.eq.${razorpayPaymentId}`);
        } else if (razorpayOrderId) {
          query = query.eq("razorpay_order_id", razorpayOrderId);
        } else if (razorpayPaymentId) {
          query = query.eq("razorpay_payment_id", razorpayPaymentId);
        }

        const { data: rows } = await query;
        if (rows?.[0]) {
          const nextStatus = rows[0].status === "shipped" || rows[0].status === "delivered" ? rows[0].status : "cancelled";
          await supabaseAdmin
            .from("orders")
            .update({
              payment_status: "refunded",
              status: nextStatus,
            })
            .eq("id", rows[0].id);
        }
      }

      return NextResponse.json({ success: true, message: "Refund processed event recorded." });
    }

    return NextResponse.json({ success: true, message: `Event ${eventName} ignored.` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
