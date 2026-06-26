"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Eye, MessageCircle, Truck } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { EmptyState, Modal, inputClass } from "@/components/admin/ui";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { getErrorMessage } from "@/lib/api/errors";
import { formatINR, formatDate } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_TONE: Record<string, "leaf" | "saffron" | "maroon" | "muted"> = {
  paid: "leaf",
  pending: "saffron",
  failed: "maroon",
  cod: "muted",
};

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, updateOrder } = useAdmin();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [viewing, setViewing] = useState<Order | null>(null);
  const [deliveryCompany, setDeliveryCompany] = useState("");
  const [deliveryTrackingId, setDeliveryTrackingId] = useState("");
  const [modalStatus, setModalStatus] = useState<OrderStatus>("new");
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [shippingPrompt, setShippingPrompt] = useState<Order | null>(null);
  const [promptCompany, setPromptCompany] = useState("");
  const [promptTracking, setPromptTracking] = useState("");
  const [promptError, setPromptError] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!viewing) return;
    setDeliveryCompany(viewing.deliveryCompany ?? "");
    setDeliveryTrackingId(viewing.deliveryTrackingId ?? "");
    setModalStatus(viewing.status);
  }, [viewing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleStatusChange(order: Order, nextStatus: OrderStatus) {
    if (nextStatus === "shipped") {
      setShippingPrompt(order);
      setPromptCompany(order.deliveryCompany ?? "");
      setPromptTracking(order.deliveryTrackingId ?? "");
      setPromptError("");
      return;
    }

    try {
      await updateOrderStatus(order.id, nextStatus);
    } catch (error) {
      setPromptError(getErrorMessage(error, "Could not update order status."));
    }
  }

  async function confirmShipped() {
    if (!shippingPrompt) return;
    const company = promptCompany.trim();
    const tracking = promptTracking.trim();
    if (!company || !tracking) {
      setPromptError("Enter both the delivery company and tracking ID.");
      return;
    }

    setPromptSaving(true);
    setPromptError("");
    try {
      await updateOrderStatus(shippingPrompt.id, "shipped", {
        deliveryCompany: company,
        deliveryTrackingId: tracking,
      });
      setShippingPrompt(null);
    } catch (error) {
      setPromptError(getErrorMessage(error, "Could not mark order as shipped."));
    } finally {
      setPromptSaving(false);
    }
  }

  async function saveDeliveryDetails() {
    if (!viewing) return;

    if (modalStatus === "shipped" && (!deliveryCompany.trim() || !deliveryTrackingId.trim())) {
      setPromptError("Delivery company and tracking ID are required for shipped orders.");
      return;
    }

    setSavingDelivery(true);
    setPromptError("");
    try {
      const next = await updateOrder(viewing.id, {
        status: modalStatus,
        deliveryCompany: deliveryCompany.trim() || undefined,
        deliveryTrackingId: deliveryTrackingId.trim() || undefined,
      });
      setViewing(next);
    } catch (error) {
      setPromptError(getErrorMessage(error, "Could not save shipping details."));
    } finally {
      setSavingDelivery(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900">
            Orders
          </h1>
          <p className="text-sm text-ink-500">
            {orders.length} order{orders.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
          className={`${inputClass} max-w-[180px]`}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={26} />}
          title="No orders"
          text={
            orders.length === 0
              ? "Orders placed on the storefront will show up here."
              : "No orders match this filter."
          }
        />
      ) : (
        <div className="md:overflow-hidden md:rounded-2xl md:border md:border-cream-200 md:bg-white">
          <div className="md:overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">
                      #{o.id.replace(/^ord_/, "").toUpperCase().slice(0, 8)}
                    </td>
                    <td data-label="Customer" className="px-4 py-3">
                      <p className="font-medium text-maroon-900">
                        {o.customerName || "—"}
                      </p>
                      <p className="text-xs text-ink-400">{o.customerPhone}</p>
                    </td>
                    <td data-label="Date" className="px-4 py-3 text-ink-500">
                      {formatDate(o.createdAt)}
                    </td>
                    <td data-label="Payment" className="px-4 py-3">
                      <Badge tone={PAYMENT_TONE[o.paymentStatus] ?? "muted"}>
                        {o.paymentMethod === "cod"
                          ? "COD"
                          : o.paymentStatus === "paid"
                            ? "Paid online"
                            : o.paymentStatus}
                      </Badge>
                      {o.deliveryCompany || o.deliveryTrackingId ? (
                        <p className="mt-1 text-xs text-ink-400">
                          {o.deliveryCompany || "Courier"}{" "}
                          {o.deliveryTrackingId ? `#${o.deliveryTrackingId}` : ""}
                        </p>
                      ) : null}
                    </td>
                    <td data-label="Total" className="px-4 py-3 font-bold text-maroon-900">
                      {formatINR(o.total)}
                    </td>
                    <td data-label="Status" className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) =>
                          void handleStatusChange(o, e.target.value as OrderStatus)
                        }
                        className="h-9 rounded-lg border border-cream-300 bg-white px-2 text-xs font-medium capitalize text-ink-700 focus:border-saffron-400 focus:outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td data-label="View" className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setViewing(o)}
                        aria-label="View order"
                        className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-maroon-800"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {shippingPrompt && (
        <Modal
          title="Shipping details required"
          onClose={() => setShippingPrompt(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setShippingPrompt(null)}
                className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-ink-600 hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmShipped()}
                disabled={promptSaving}
                className="inline-flex h-10 items-center rounded-full bg-maroon-800 px-5 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60"
              >
                {promptSaving ? "Saving..." : "Mark as shipped"}
              </button>
            </>
          }
        >
          <p className="text-sm text-ink-600">
            Enter courier and tracking details for order #
            {shippingPrompt.id.replace(/^ord_/, "").toUpperCase().slice(0, 8)}.
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={promptCompany}
              onChange={(e) => setPromptCompany(e.target.value)}
              placeholder="Delivery company (e.g. Delhivery, Blue Dart)"
              className={inputClass}
            />
            <input
              value={promptTracking}
              onChange={(e) => setPromptTracking(e.target.value)}
              placeholder="Tracking / AWB number"
              className={inputClass}
            />
            {promptError && <Alert>{promptError}</Alert>}
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal
          title={`Order #${viewing.id
            .replace(/^ord_/, "")
            .toUpperCase()
            .slice(0, 8)}`}
          onClose={() => {
            setViewing(null);
            setPromptError("");
          }}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-maroon-900">
                  {viewing.customerName || "Customer"}
                </p>
                <p className="text-ink-500">{viewing.customerPhone}</p>
                {viewing.customerEmail && (
                  <p className="text-ink-500">{viewing.customerEmail}</p>
                )}
              </div>
              <div className="text-right text-ink-500">
                <p>{formatDate(viewing.createdAt)}</p>
                <p>
                  {viewing.paymentMethod === "cod"
                    ? "Cash on delivery"
                    : viewing.paymentStatus === "paid"
                      ? "Paid online"
                      : viewing.paymentStatus}
                </p>
              </div>
            </div>

            {viewing.shippingAddress && (
              <div className="rounded-xl border border-cream-200 bg-cream-50 p-4 text-sm">
                <p className="font-medium text-maroon-900">Delivery address</p>
                <p className="mt-1 text-ink-600">
                  {viewing.shippingAddress.line1}
                  {viewing.shippingAddress.line2
                    ? `, ${viewing.shippingAddress.line2}`
                    : ""}
                </p>
                <p className="text-ink-600">
                  {viewing.shippingAddress.district
                    ? `${viewing.shippingAddress.district}, `
                    : ""}
                  {viewing.shippingAddress.city}, {viewing.shippingAddress.state}{" "}
                  {viewing.shippingAddress.pincode}
                </p>
                {viewing.notes && (
                  <p className="mt-2 text-xs text-ink-500">
                    Note: {viewing.notes}
                  </p>
                )}
              </div>
            )}

            <div className="rounded-xl border border-cream-200 bg-white p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-maroon-900">
                <Truck size={16} /> Shipping update
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as OrderStatus)}
                  className={inputClass}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  value={deliveryCompany}
                  onChange={(e) => setDeliveryCompany(e.target.value)}
                  placeholder="Delivery company"
                  className={inputClass}
                />
                <input
                  value={deliveryTrackingId}
                  onChange={(e) => setDeliveryTrackingId(e.target.value)}
                  placeholder="Delivery / tracking ID"
                  className={inputClass}
                />
              </div>
              {promptError && !shippingPrompt ? (
                <div className="mt-3">
                  <Alert>{promptError}</Alert>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void saveDeliveryDetails()}
                disabled={savingDelivery}
                className="mt-3 inline-flex h-10 items-center rounded-full bg-maroon-800 px-5 text-sm font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60"
              >
                {savingDelivery ? "Saving..." : "Save shipping details"}
              </button>
            </div>

            <ul className="divide-y divide-cream-200 rounded-xl border border-cream-200">
              {viewing.items.map((it, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="text-ink-700">
                    {it.name}{" "}
                    <span className="text-ink-400">
                      ({it.variantLabel}) × {it.quantity}
                    </span>
                  </span>
                  <span className="font-medium text-maroon-900">
                    {formatINR(it.price * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-ink-500">
                <span>Subtotal</span>
                <span>{formatINR(viewing.subtotal)}</span>
              </div>
              {viewing.discount ? (
                <div className="flex justify-between text-leaf-600">
                  <span>Discount</span>
                  <span>−{formatINR(viewing.discount)}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-ink-500">
                <span>Shipping</span>
                <span>
                  {viewing.shipping ? formatINR(viewing.shipping) : "Free"}
                </span>
              </div>
              <div className="flex justify-between border-t border-cream-200 pt-2 text-base font-bold text-maroon-900">
                <span>Total</span>
                <span>{formatINR(viewing.total)}</span>
              </div>
            </div>

            <a
              href={waLink(
                `Hello ${viewing.customerName || ""}! Regarding your order #${viewing.id
                  .replace(/^ord_/, "")
                  .toUpperCase()
                  .slice(0, 8)}…`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#35B664] text-sm font-semibold text-white hover:bg-[#2E9E57]"
            >
              <MessageCircle size={17} /> Message customer
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
