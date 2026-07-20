"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Search, MessageCircle } from "lucide-react";

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

export default function PublicOrderLookupPage() {
  const params = useParams();
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
      const message = e instanceof Error ? e.message : "Could not fetch order";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // If route has an id, auto-lookup once.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!idFromRoute) return;
    if (order) return;
    void runLookup();
  }, [idFromRoute, order, runLookup]);
  /* eslint-enable react-hooks/set-state-in-effect */


  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 pb-10 pt-8">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl font-bold text-maroon-900">Track your order</h1>
        <p className="text-sm text-ink-500">
          Enter your order id to view status and delivery details.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Order id (e.g. 1A2B3C4D or ord_1A2B3C4D)"
          className={inputClass + " flex-1"}
        />
        <button
          type="button"
          onClick={() => void runLookup()}
          disabled={!isSearchable || loading}
          className="inline-flex h-11 items-center justify-center rounded-full bg-maroon-800 px-5 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60"
        >
          {loading ? "Searching..." : <Search size={16} />}
        </button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      {loading && !order ? null : order ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-ink-400">Order</p>
              <p className="font-mono text-sm font-semibold text-ink-700">{order.id.replace(/^ord_/, "").toUpperCase()}</p>
            </div>
            <Badge tone={PAYMENT_TONE[order.paymentStatus] ?? "muted"}>
              {order.paymentMethod === "cod"
                ? "COD"
                : order.paymentStatus === "paid"
                  ? "Paid online"
                  : order.paymentStatus}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="text-sm text-ink-500">Status:</p>
            <p className="capitalize text-sm font-semibold text-maroon-900">{order.status}</p>
          </div>

          <div className="mt-2 text-sm text-ink-500">
            Placed on {formatDate(order.createdAt)}
          </div>

          {order.deliveryCompany || order.deliveryTrackingId ? (
            <div className="mt-3 rounded-xl bg-cream-50 p-3">
              <p className="text-xs font-medium text-maroon-900">Delivery</p>
              <p className="mt-1 text-sm text-ink-600">
                {order.deliveryCompany ? order.deliveryCompany : "Courier"}
                {order.deliveryTrackingId ? ` · Tracking #${order.deliveryTrackingId}` : ""}
              </p>
            </div>
          ) : null}

          <div className="mt-4">
            <p className="text-xs font-medium text-ink-400">Items</p>
            <ul className="mt-2 divide-y divide-cream-200 rounded-xl border border-cream-200">
              {order.items.map((it, idx) => (
                <li key={idx} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-ink-700">
                    {it.name} <span className="text-ink-400">({it.variantLabel}) × {it.quantity}</span>
                  </span>
                  <span className="font-medium text-maroon-900">{formatINR(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-cream-200 pt-3 text-base font-bold text-maroon-900">
            <span>Total</span>
            <span>{formatINR(order.total)}</span>
          </div>

          <div className="mt-4 pt-2">
            <a
              href={waLink(buildFormattedWhatsAppOrderMessage(order as unknown as Order))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle size={18} /> Send Order Details via WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Search size={26} />}
          title="Search by order id"
          text="Type your order id above and hit Search to view your order details."
        />
      )}
    </div>
  );
}

