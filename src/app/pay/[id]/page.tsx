"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, ShoppingBag, ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { loadRazorpayScript, openRazorpayCheckout } from "@/lib/razorpay";
import { createRazorpayOrder, verifyRazorpayPayment, type RazorpayOrder } from "@/lib/api/payments";
import { formatINR } from "@/lib/utils";
import { config } from "@/lib/config";
import { toast } from "@/components/ui/toast";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

type PublicOrderLookupResponse = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  total: number;
  items: { name: string; variantLabel: string; quantity: number; price: number }[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
};

export default function DedicatedPaymentPage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<PublicOrderLookupResponse | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<PublicOrderLookupResponse>(`/orders/lookup/${encodeURIComponent(id)}`);
      setOrder(res);
    } catch {
      setError("Could not find this order. Please verify the link.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchOrder();
    void loadRazorpayScript(); // Preload Razorpay SDK immediately on mount
  }, [fetchOrder]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Pre-create Razorpay order in background to make payment modal trigger instantly on click
  useEffect(() => {
    if (!order || order.paymentStatus === "paid") return;
    let active = true;
    createRazorpayOrder(order.total)
      .then((rzOrder) => {
        if (active) setRazorpayOrder(rzOrder);
      })
      .catch((err) => {
        console.error("Failed to pre-create Razorpay order in background:", err);
      });
    return () => {
      active = false;
    };
  }, [order]);

  const handlePayment = async () => {
    if (!order) return;
    setPaymentLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Could not load payment gateway. Please try again.");

      let rzOrder = razorpayOrder;
      if (!rzOrder) {
        rzOrder = await createRazorpayOrder(order.total);
        setRazorpayOrder(rzOrder);
      }

      openRazorpayCheckout({
        key: rzOrder.keyId,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        order_id: rzOrder.id,
        name: config.businessName,
        description: `Payment for Order #${order.id.replace(/^ord_/, "").toUpperCase().slice(0, 8)}`,
        prefill: {
          name: order.customerName || "",
          email: order.customerEmail || "",
          ...(order.customerPhone && order.customerPhone.replace(/\D/g, "")
            ? { contact: order.customerPhone.replace(/\D/g, "") }
            : {}),
        },
        theme: { color: "#7f1d1d" },
        handler: async (response) => {
          try {
            setPaymentLoading(true);
            const { verified } = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.id,
            });
            if (!verified) throw new Error("Payment verification failed.");
            
            toast({
              tone: "success",
              title: "Payment Successful",
              message: "Thank you! Your payment has been verified successfully.",
            });
            void fetchOrder();
          } catch (err) {
            toast({
              tone: "error",
              title: "Verification Failed",
              message: err instanceof Error ? err.message : "Something went wrong.",
            });
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          }
        }
      });
    } catch (err) {
      toast({
        tone: "error",
        title: "Payment failed",
        message: err instanceof Error ? err.message : "Could not initialize Razorpay.",
      });
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 sm:py-12">
        <div className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-xl">
          {/* Header Skeleton */}
          <div className="bg-gradient-to-br from-maroon-800/10 to-maroon-950/10 p-6 text-center space-y-2 animate-pulse">
            <div className="mx-auto h-5 w-40 rounded-md bg-maroon-800/20" />
            <div className="mx-auto h-3.5 w-24 rounded-md bg-maroon-800/10" />
          </div>

          <div className="p-6 space-y-6 animate-pulse">
            {/* Order Summary Skeleton */}
            <div className="text-center space-y-3">
              <div className="mx-auto h-3 w-28 rounded bg-cream-200" />
              <div className="mx-auto h-10 w-36 rounded-lg bg-cream-200" />
              <div className="mx-auto h-3.5 w-32 rounded bg-cream-200" />
            </div>

            {/* Pay Button Skeleton */}
            <div className="h-12 w-full rounded-full bg-cream-200" />

            {/* Cart Items Skeleton */}
            <div className="border-t border-cream-100 pt-5 space-y-3">
              <div className="h-4 w-28 rounded bg-cream-200" />
              <div className="space-y-2.5">
                {[1, 2].map((i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-3 rounded-2xl border border-cream-100/50 bg-cream-50/10">
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-2/3 rounded bg-cream-200" />
                      <div className="h-2.5 w-1/3 rounded bg-cream-200" />
                    </div>
                    <div className="h-4 w-12 rounded bg-cream-200 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6 space-y-4">
          <p className="text-sm font-medium text-rose-800">{error || "Order not found"}</p>
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-full bg-maroon-800 px-5 text-xs font-semibold text-cream-50 hover:bg-maroon-700"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "paid";
  const shortId = order.id.replace(/^ord_/, "").toUpperCase().slice(0, 8);

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-12">
      <div className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="bg-gradient-to-br from-maroon-800 to-maroon-950 p-6 text-center text-cream-50 relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <h1 className="font-serif text-xl font-bold uppercase tracking-wide">{config.businessName}</h1>
          <p className="text-xs text-cream-200/80 mt-1">Secure Checkout Gateway</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary Card */}
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-ink-500">Order ID: #{shortId}</span>
            <p className="text-3xl font-black text-maroon-900">{formatINR(order.total)}</p>
            <p className="text-xs text-ink-500 font-medium">For {order.customerName}</p>
          </div>

          {/* Payment Status State Card */}
          {isPaid ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-600 animate-bounce" />
              <h3 className="font-bold text-emerald-800 text-base">Payment Completed</h3>
              <p className="text-xs text-emerald-600 font-medium">
                Thank you! Your payment has been successfully received and verified.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60 transition-all cursor-pointer active:scale-[0.98]"
              >
                {paymentLoading ? "Connecting to gateway..." : `Pay ${formatINR(order.total)} Now`}
                {!paymentLoading && <ArrowRight size={16} />}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-ink-500 text-[10px] font-semibold">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>100% Secure SSL Payment powered by Razorpay</span>
              </div>
            </div>
          )}

          {/* Cart items list */}
          <div className="border-t border-cream-100 pt-5 space-y-3">
            <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag size={14} /> Item Details ({order.items.length})
            </h4>
            <ul className="divide-y divide-cream-50 rounded-2xl border border-cream-100 overflow-hidden bg-cream-50/20">
              {order.items.map((it, idx) => (
                <li key={idx} className="flex justify-between gap-3 px-4 py-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-800 truncate">{it.name}</p>
                    <p className="text-[10px] text-ink-500 mt-0.5">
                      Size: {it.variantLabel} <span className="mx-1">·</span> Qty: {it.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-maroon-900 shrink-0">{formatINR(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
