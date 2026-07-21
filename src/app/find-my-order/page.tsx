"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, Package, User, Truck } from "lucide-react";

import { EmptyState, inputClass } from "@/components/admin/ui";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api/client";
import { formatINR, formatDate } from "@/lib/utils";
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

const PAYMENT_TONE: Record<string, "leaf" | "saffron" | "maroon" | "muted"> = {
  paid: "leaf",
  pending: "saffron",
  failed: "maroon",
  cod: "muted",
};

const STATUS_LABEL: Record<Order["status"], string> = {
  new: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function normalizePhoneForLookup(raw: string) {
  return raw.trim().replace(/\D/g, "");
}

function parseLookupQuery(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "empty" as const, value: "" };

  const looksLikePhone = /^\+?[0-9]{8,15}$/.test(trimmed);
  if (looksLikePhone) {
    return { kind: "phone" as const, value: normalizePhoneForLookup(trimmed) };
  }

  return { kind: "order" as const, value: trimmed };
}

function maskTrackingId(trackingId?: string) {
  if (!trackingId) return undefined;
  if (trackingId.length <= 4) return trackingId;
  return `••••${trackingId.slice(-4)}`;
}

export default function FindMyOrderPage() {
  const { customer } = useAuth();

  // If logged in: show authenticated user's orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string>("");

  // If guest: show lookup/search UI
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchResults, setSearchResults] = useState<PublicOrderLookupResponse[]>([]);
  const loadedOrdersCustomerId = useRef<string | null>(null);

  const parsedQuery = useMemo(() => parseLookupQuery(query), [query]);
  const isSearchable = parsedQuery.value.trim().length >= 6;

  const runLookup = useCallback(async () => {
    const parsed = parseLookupQuery(query);
    const raw = parsed.value.trim();
    if (!raw) return;

    setLoading(true);
    setError("");
    setSearchResults([]);

    try {
      if (parsed.kind === "phone") {
        const res = await apiGet<PublicOrderLookupResponse[] | PublicOrderLookupResponse>(
          `/orders/lookup/phone/${encodeURIComponent(raw)}`,
        );
        if (Array.isArray(res)) {
          setSearchResults(res);
        } else if (res) {
          setSearchResults([res]);
        }
      } else {
        const res = await apiGet<PublicOrderLookupResponse>(
          `/orders/lookup/${encodeURIComponent(raw)}`,
        );
        if (res) {
          setSearchResults([res]);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fetch orders");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function loadOrders() {
      if (!customer) return;
      if (loadedOrdersCustomerId.current === customer.id) return;
      loadedOrdersCustomerId.current = customer.id;
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const data = await apiGet<Order[]>("/orders");
        if (!cancelled) setOrders(data);
      } catch {
        if (!cancelled) setOrdersError("Could not load your orders. Please refresh the page.");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    }
    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [customer]);

  return (
    <Container>
      <div className="py-10">
        {customer ? (
          <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="font-serif text-3xl font-bold text-maroon-900">Your Orders</h1>

            {ordersLoading ? (
              <div className="rounded-2xl border border-cream-200 bg-white p-6">Loading…</div>
            ) : null}

            {ordersError ? <Alert>{ordersError}</Alert> : null}

            {orders.length === 0 && !ordersLoading ? (
              <div className="rounded-2xl border border-dashed border-cream-300 bg-white py-16 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-maroon-800">
                  <Package size={26} />
                </span>
                <p className="mt-4 font-medium text-maroon-900">No orders yet</p>
                <p className="mt-1 text-sm text-ink-500">Your placed orders will appear here.</p>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex h-10 items-center rounded-full bg-maroon-800 px-5 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
                >
                  Start shopping
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {orders.map((o) => (
                  <li key={o.id} className="rounded-2xl border border-cream-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-200 pb-3">
                      <div>
                        <p className="text-sm font-semibold text-maroon-900">
                          #{o.id.replace(/^ord_/, "").toUpperCase()}
                        </p>
                        <p className="text-xs text-ink-400">
                          {formatDate(o.createdAt)} •{" "}
                          {o.paymentMethod === "cod"
                            ? "Cash on delivery"
                            : o.paymentStatus === "paid"
                              ? "Paid online"
                              : "Online"}
                        </p>
                      </div>
                      <Badge
                        tone={
                          o.status === "delivered"
                            ? "leaf"
                            : o.status === "cancelled"
                              ? "muted"
                              : "saffron"
                        }
                      >
                        {STATUS_LABEL[o.status]}
                      </Badge>
                    </div>

                    <ul className="mt-3 space-y-1 text-sm text-ink-700">
                      {o.items.map((it, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span>
                            {it.name} <span className="text-ink-400">({it.variantLabel}) × {it.quantity}</span>
                          </span>
                          <span>{formatINR(it.price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>

                    {(o.deliveryCompany || o.deliveryTrackingId) && (
                      <div className="mt-3 rounded-xl bg-cream-50 px-3 py-2 text-sm text-ink-600">
                        <p className="flex items-center gap-1.5 font-medium text-maroon-900">
                          <Truck size={15} /> Shipped with {o.deliveryCompany || "our delivery partner"}
                        </p>
                        {o.deliveryTrackingId ? (
                          <p className="mt-1 text-xs">
                            Delivery tracking: <span className="font-semibold text-ink-800">{maskTrackingId(o.deliveryTrackingId)}</span>
                          </p>
                        ) : null}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-cream-200 pt-3 text-sm">
                      <span className="text-ink-500">Payment: {o.paymentStatus}</span>
                      <span className="font-bold text-maroon-900">{formatINR(o.total)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-2xl space-y-5 px-4 pb-10 pt-8">
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-maroon-900">Find my order</h1>
              <p className="text-sm text-ink-500">Enter your order id or phone number to view status and delivery details.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isSearchable && !loading) void runLookup();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Order id (ord_...) or phone number (e.g. 9876543210)"
                className={inputClass + " flex-1"}
              />
              <button
                type="submit"
                disabled={!isSearchable || loading}
                className="inline-flex h-11 items-center justify-center rounded-full bg-maroon-800 px-6 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60 shrink-0"
              >
                {loading ? "Searching…" : <Search size={16} />}
              </button>
            </form>

            {error ? <Alert>{error}</Alert> : null}

            {loading ? (
              <div className="rounded-2xl border border-cream-200 bg-white p-6 text-center text-sm text-ink-500">
                Searching orders…
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-600 uppercase tracking-wider px-1">
                  <span>Found {searchResults.length} {searchResults.length === 1 ? "order" : "orders"}</span>
                </div>

                {searchResults.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-cream-200 bg-white p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-cream-200 pb-3">
                      <div>
                        <p className="text-xs text-ink-400">Order ID</p>
                        <p className="font-mono text-sm font-bold text-maroon-900">
                          #{order.id.replace(/^ord_/, "").toUpperCase()}
                        </p>
                      </div>
                      <Badge tone={PAYMENT_TONE[order.paymentStatus] ?? "muted"}>
                        {order.paymentMethod === "cod"
                          ? "COD"
                          : order.paymentStatus === "paid"
                            ? "Paid online"
                            : order.paymentStatus}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-ink-500">Status:</span>
                        <span className="capitalize font-semibold text-maroon-900">{order.status}</span>
                      </div>
                      <span className="text-xs text-ink-400">Placed on {formatDate(order.createdAt)}</span>
                    </div>

                    {order.deliveryCompany || order.deliveryTrackingId ? (
                      <div className="rounded-xl bg-cream-50 p-3 text-sm text-ink-600">
                        <p className="flex items-center gap-1.5 font-medium text-maroon-900">
                          <Truck size={15} /> Delivery: {order.deliveryCompany || "Courier"}
                        </p>
                        {order.deliveryTrackingId ? (
                          <p className="mt-1 text-xs">
                            Tracking #: <span className="font-semibold text-ink-800">{maskTrackingId(order.deliveryTrackingId)}</span>
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div>
                      <p className="text-xs font-medium text-ink-400 mb-1.5">Items ({order.items.length})</p>
                      <ul className="divide-y divide-cream-200 rounded-xl border border-cream-200 bg-cream-50/50">
                        {order.items.map((it, idx) => (
                          <li key={idx} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                            <span className="text-ink-700 font-medium">
                              {it.name} <span className="text-ink-400 font-normal">({it.variantLabel}) × {it.quantity}</span>
                            </span>
                            <span className="font-bold text-maroon-900">{formatINR(it.price * it.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between border-t border-cream-200 pt-3 text-base font-bold text-maroon-900">
                      <span>Total Amount</span>
                      <span>{formatINR(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : !loading && !error && query.trim() ? null : (
              <EmptyState
                icon={<Search size={26} />}
                title="Search by order id or phone"
                text="Type your order id or phone number above and hit Search to view your order details."
              />
            )}

            <div className="rounded-2xl border border-cream-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-maroon-800 shrink-0">
                  <User size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-maroon-900">Want to view your orders anytime?</p>
                  <p className="mt-1 text-sm text-ink-600">
                    Log in to see all your orders automatically under My Account.
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/login?redirect=/find-my-order"
                      className="inline-flex h-10 items-center justify-center rounded-full bg-maroon-800 px-5 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
                    >
                      Login / Sign up
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
