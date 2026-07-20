import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

/** Verify HMAC SHA256 signature using Web Crypto API */
async function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody),
    );
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expectedSignature.toLowerCase() === signature.trim().toLowerCase();
  } catch (err) {
    console.error("Error verifying signature:", err);
    return false;
  }
}

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  email?: string;
  contact?: string;
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const webhookSecret =
    Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ||
    Deno.env.get("RAZORPAY_KEY_SECRET") ||
    "";
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured in Edge Function secrets.");
    return new Response(
      JSON.stringify({ error: "Server configuration error: Webhook secret missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing x-razorpay-signature header" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const rawBody = await req.text();
  const isValid = await verifySignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    console.warn("Invalid Razorpay webhook signature");
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase environment variables missing.");
    return new Response(
      JSON.stringify({ error: "Database configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const eventName = body.event;
  console.log(`Processing Razorpay event: ${eventName}`);

  try {
    if (eventName === "payment.captured") {
      const payment = body.payload?.payment?.entity;
      if (!payment) {
        return new Response(
          JSON.stringify({ error: "Missing payment entity in payload" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;
      const customOrderId = payment.notes?.orderId;

      // Find order by custom order ID or by stored razorpay_order_id
      let query = supabase.from("orders").select("id, total, status, payment_status");
      if (customOrderId) {
        query = query.or(`id.eq.${customOrderId},razorpay_order_id.eq.${razorpayOrderId}`);
      } else {
        query = query.eq("razorpay_order_id", razorpayOrderId);
      }

      const { data: rows, error: selectError } = await query;
      if (selectError) {
        console.error("Error querying orders:", selectError);
        return new Response(
          JSON.stringify({ error: selectError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const orderRow = rows?.[0];
      if (!orderRow) {
        console.warn(`No matching order found for Razorpay Order ID: ${razorpayOrderId}`);
        return new Response(
          JSON.stringify({ message: "Webhook received, but no matching order found." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Update payment status to paid & set order status to confirmed if pending
      const nextStatus = orderRow.status === "pending" ? "confirmed" : orderRow.status;
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: nextStatus,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
        })
        .eq("id", orderRow.id);

      if (updateError) {
        console.error("Error updating order:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      console.log(`Order ${orderRow.id} marked as paid successfully.`);
      return new Response(
        JSON.stringify({ success: true, message: `Order ${orderRow.id} marked as paid.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (eventName === "payment.failed") {
      const payment = body.payload?.payment?.entity;
      if (payment) {
        const razorpayOrderId = payment.order_id;
        const customOrderId = payment.notes?.orderId;

        let query = supabase.from("orders").select("id");
        if (customOrderId) {
          query = query.or(`id.eq.${customOrderId},razorpay_order_id.eq.${razorpayOrderId}`);
        } else {
          query = query.eq("razorpay_order_id", razorpayOrderId);
        }

        const { data: rows } = await query;
        if (rows?.[0]) {
          await supabase
            .from("orders")
            .update({
              payment_status: "failed",
              razorpay_payment_id: payment.id,
            })
            .eq("id", rows[0].id);
          console.log(`Order ${rows[0].id} payment marked as failed.`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Payment failure recorded." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (eventName === "order.paid") {
      const order = body.payload?.order?.entity;
      if (order) {
        const razorpayOrderId = order.id;
        const customOrderId = order.notes?.orderId;

        let query = supabase.from("orders").select("id, status");
        if (customOrderId) {
          query = query.or(`id.eq.${customOrderId},razorpay_order_id.eq.${razorpayOrderId}`);
        } else {
          query = query.eq("razorpay_order_id", razorpayOrderId);
        }

        const { data: rows } = await query;
        if (rows?.[0]) {
          const nextStatus = rows[0].status === "pending" ? "confirmed" : rows[0].status;
          await supabase
            .from("orders")
            .update({
              payment_status: "paid",
              status: nextStatus,
              razorpay_order_id: razorpayOrderId,
            })
            .eq("id", rows[0].id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Order paid event processed." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (eventName === "refund.processed") {
      const refund = body.payload?.refund?.entity;
      const payment = body.payload?.payment?.entity;
      const razorpayPaymentId = refund?.payment_id || payment?.id;
      const razorpayOrderId = payment?.order_id;
      const customOrderId = refund?.notes?.orderId || payment?.notes?.orderId;

      if (razorpayPaymentId || razorpayOrderId || customOrderId) {
        let query = supabase.from("orders").select("id, status");
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
          await supabase
            .from("orders")
            .update({
              payment_status: "refunded",
              status: nextStatus,
            })
            .eq("id", rows[0].id);
          console.log(`Order ${rows[0].id} marked as refunded.`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Refund processed event recorded." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Default response for unhandled events
    return new Response(
      JSON.stringify({ success: true, message: `Event ${eventName} ignored.` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unhandled error processing webhook:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
