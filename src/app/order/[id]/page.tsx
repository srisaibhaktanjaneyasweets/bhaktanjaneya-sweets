"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, MessageCircle, CheckCircle2, ShoppingBag, Home } from "lucide-react";

import { EmptyState, inputClass } from "@/components/admin/ui";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { formatINR, formatDate } from "@/lib/utils";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";
import { apiGet } from "@/lib/api/client";
import { waLink, buildFormattedWhatsAppOrderMessage } from "@/lib/whatsapp";

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

const PAYMENT_TONE: Record<string, "leaf" | "saffron" | "maroon" | "muted"> = {
  paid: "leaf",
  pending: "saffron",
  failed: "maroon",
  cod: "muted",
};

const STATUS_DESCRIPTION: Record<OrderStatus, string> = {
  new: "We've received your order and it's awaiting processing.",
  confirmed: "Your order is confirmed and will be prepared shortly.",
  packed: "Our chefs have packed your delicious sweets fresh.",
  shipped: "Your package is on its way to you!",
  delivered: "Your sweets have been delivered. Enjoy!",
  cancelled: "This order has been cancelled.",
};

export default function PublicOrderLookupPage() {
  const params = useParams();
  const router = useRouter();
  const idFromRoute = useMemo(() => (params?.id ? String(params.id) : ""), [params]);

  const [orderId, setOrderId] = useState<string>(idFromRoute);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [order, setOrder] = useState<PublicOrderLookupResponse | null>(null);

  const isSearchable = orderId.trim().length >= 6;

  const runLookup = useCallback(async () => {
    const raw = orderId.trim();
    if (!raw) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await apiGet<PublicOrderLookupResponse>(`/orders/lookup/${encodeURIComponent(raw)}`);
      setOrder(res);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not find order. Please verify your order ID.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Auto-lookup if redirected with an ID in route
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!idFromRoute) return;
    void runLookup();
  }, [idFromRoute, runLookup]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      {/* 1. HEADER SECTION */}
      {idFromRoute ? (
        // Celebratory Checkout Success Header
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-soft mb-4">
            <CheckCircle2 size={40} className="stroke-[2.2]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-maroon-900 leading-tight">Order Placed!</h1>
          <p className="mt-2 text-sm text-ink-500 max-w-sm mx-auto leading-relaxed">
            Thank you for shopping with us! We have received your order and are preparing it fresh.
          </p>
        </div>
      ) : (
        // Standard Manual Tracking Header
        <div className="mb-6 space-y-2">
          <h1 className="font-serif text-2xl font-bold text-maroon-900">Track your order</h1>
          <p className="text-sm text-ink-500">
            Enter your order ID below to check status, items, and tracking details.
          </p>
        </div>
      )}

      {/* 2. SEARCH BOX (Only show if not auto-loaded or if there's an error) */}
      {(!idFromRoute || error) && (
        <div className="flex items-center gap-2 mb-6">
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order ID (e.g. ord_1A2B3C)"
            className={inputClass + " flex-1 h-11 text-sm"}
          />
          <button
            type="button"
            onClick={() => void runLookup()}
            disabled={!isSearchable || loading}
            className="inline-flex h-11 items-center justify-center rounded-full bg-maroon-800 px-5 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60 transition-colors cursor-pointer shrink-0"
          >
            {loading ? "Searching..." : <Search size={16} />}
          </button>
        </div>
      )}

      {/* 3. ERROR ALERT */}
      {error ? <Alert className="mb-6">{error}</Alert> : null}

      {/* 4. LOADING STATE */}
      {loading && (
        <div className="animate-pulse space-y-4 rounded-2xl border border-cream-200 bg-white p-5 shadow-soft">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-cream-100 rounded w-1/4"></div>
            <div className="h-6 bg-cream-100 rounded-full w-20"></div>
          </div>
          <div className="h-6 bg-cream-100 rounded w-1/2 mt-2"></div>
          <div className="h-1 bg-cream-100/50 rounded w-full my-4"></div>
          <div className="space-y-2">
            <div className="h-10 bg-cream-100 rounded w-full"></div>
            <div className="h-10 bg-cream-100 rounded w-full"></div>
          </div>
        </div>
      )}

      {/* 5. ORDER DETAILS */}
      {!loading && order && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="rounded-2xl border border-cream-150 bg-white p-5 shadow-soft">
            {/* Header info row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cream-100 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-400">Order ID</p>
                <p className="font-mono text-base font-bold text-ink-800">
                  {order.id.replace(/^ord_/, "").toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <Badge tone={PAYMENT_TONE[order.paymentStatus] ?? "muted"} className="px-3 py-1 text-xs">
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : order.paymentStatus === "paid"
                      ? "Paid Online"
                      : `Payment: ${order.paymentStatus}`}
                </Badge>
              </div>
            </div>

            {/* Placement Date */}
            <div className="mt-4 flex flex-col sm:flex-row sm:justify-between text-xs text-ink-500 gap-1">
              <span>Placed on {formatDate(order.createdAt)}</span>
              {order.paymentMethod === "cod" && (
                <span className="text-maroon-800 font-medium">Please pay upon delivery</span>
              )}
            </div>

            {/* Status Summary */}
            <div className="mt-4 rounded-xl bg-maroon-50/40 border border-maroon-100/40 p-3.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-ink-400 font-medium">Order Status:</span>
                <span className="text-sm font-bold capitalize text-maroon-900">{order.status}</span>
              </div>
              <p className="mt-1 text-xs text-ink-600">
                {STATUS_DESCRIPTION[order.status] || "We'll notify you as soon as your order updates."}
              </p>
            </div>

            {/* Delivery Tracking */}
            {order.deliveryCompany || order.deliveryTrackingId ? (
              <div className="mt-4 rounded-xl bg-cream-50/50 border border-cream-200/50 p-3.5">
                <p className="text-xs font-bold text-maroon-900 uppercase tracking-wider">Shipment Details</p>
                <p className="mt-1.5 text-sm text-ink-700">
                  <span className="font-medium">{order.deliveryCompany ? order.deliveryCompany : "Courier Partner"}</span>
                  {order.deliveryTrackingId ? (
                    <>
                      <br />
                      <span className="text-xs text-ink-500">Tracking Number: </span>
                      <span className="font-mono font-semibold text-ink-800">{order.deliveryTrackingId}</span>
                    </>
                  ) : null}
                </p>
              </div>
            ) : null}

            {/* Items Ordered */}
            <div className="mt-6">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2.5">Items Ordered</p>
              <ul className="divide-y divide-cream-100 rounded-xl border border-cream-100 overflow-hidden bg-cream-50/10">
                {order.items.map((it, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-800 truncate">{it.name}</p>
                      <p className="text-xs text-ink-400 mt-0.5">
                        Size: {it.variantLabel} <span className="mx-1.5">·</span> Qty: {it.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-maroon-900 shrink-0">
                      {formatINR(it.price * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Subtotal / Total */}
            <div className="mt-5 flex items-center justify-between border-t border-cream-100 pt-4 text-base font-bold text-maroon-900">
              <span>Total Amount</span>
              <span className="text-lg">{formatINR(order.total)}</span>
            </div>
          </div>

          {/* 6. WHATSAPP ACTION BUTTON */}
          <div className="space-y-3 pt-2">
            <a
              href={waLink(buildFormattedWhatsAppOrderMessage(order as unknown as Order))}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-all active:scale-[0.98] cursor-pointer"
            >
              <MessageCircle size={19} className="fill-white/10" />
              Send Order Details via WhatsApp
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </a>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-cream-300 bg-white px-6 text-sm font-semibold text-maroon-900 hover:bg-cream-50 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Home size={16} />
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* 7. EMPTY STATE (No order id query) */}
      {!loading && !order && !idFromRoute && (
        <EmptyState
          icon={<ShoppingBag size={32} className="text-maroon-800/60" />}
          title="No order selected"
          text="Use the tracking input above to search for order details, status, and shipments."
        />
      )}
    </div>
  );
}
