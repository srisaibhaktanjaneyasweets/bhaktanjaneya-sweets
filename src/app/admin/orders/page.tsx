"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  Eye,
  MessageCircle,
  Truck,
  Printer,
  FileSpreadsheet,
  Download,
  Search,
  IndianRupee,
  Clock,
  CheckCircle2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { EmptyState, Modal, inputClass, AdminButton } from "@/components/admin/ui";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { getErrorMessage } from "@/lib/api/errors";
import { formatINR, formatDate } from "@/lib/utils";
import { waLinkToPhone, buildAdminCustomerWhatsAppMessage } from "@/lib/whatsapp";
import { printThermalReceipt, printFullInvoice } from "@/lib/thermal-receipt";
import { downloadOrdersCSV, type ExportFilters } from "@/lib/export-orders";
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
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
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

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState<ExportFilters>({
    dateRange: "all",
    startDate: "",
    endDate: "",
    status: "all",
    paymentStatus: "all",
    limit: "all",
  });

  // KPI Metrics Calculations
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "paid" || o.status === "delivered")
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === "new" || o.status === "confirmed").length;
    const shippedOrders = orders.filter((o) => o.status === "shipped").length;
    const deliveredOrders = orders.filter((o) => o.status === "delivered").length;

    return { totalOrders, totalRevenue, pendingOrders, shippedOrders, deliveredOrders };
  }, [orders]);

  // Search & Filter Logic
  const filtered = useMemo(() => {
    let result = orders;

    // Status filter
    if (filter !== "all") {
      result = result.filter((o) => o.status === filter);
    }

    // Payment status filter
    if (paymentFilter !== "all") {
      result = result.filter((o) => o.paymentStatus === paymentFilter);
    }

    // Text search query filter (matches ID, customer name, phone, email, city)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const shortId = o.id.replace(/^ord_/, "").toLowerCase();
        const name = (o.customerName || "").toLowerCase();
        const phone = (o.customerPhone || "").toLowerCase();
        const email = (o.customerEmail || "").toLowerCase();
        const city = (o.shippingAddress?.city || "").toLowerCase();
        return shortId.includes(q) || name.includes(q) || phone.includes(q) || email.includes(q) || city.includes(q);
      });
    }

    return result;
  }, [orders, filter, paymentFilter, searchQuery]);

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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">
            Order Management
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Track, print receipts, process dispatches, and manage customer orders.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminButton onClick={() => setExportModalOpen(true)}>
            <FileSpreadsheet size={16} /> Export Excel (CSV)
          </AdminButton>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Total Revenue</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-600/10 text-leaf-600">
              <IndianRupee size={20} />
            </span>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-maroon-900">{formatINR(metrics.totalRevenue)}</p>
          <p className="mt-1 text-xs text-ink-500">From paid &amp; delivered orders</p>
        </div>

        <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Pending Orders</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-500/10 text-saffron-600">
              <Clock size={20} />
            </span>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-maroon-900">{metrics.pendingOrders}</p>
          <p className="mt-1 text-xs text-ink-500">Require packing or confirmation</p>
        </div>

        <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">In Transit</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Truck size={20} />
            </span>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-maroon-900">{metrics.shippedOrders}</p>
          <p className="mt-1 text-xs text-ink-500">Currently out for delivery</p>
        </div>

        <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Delivered</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 size={20} />
            </span>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-maroon-900">{metrics.deliveredOrders}</p>
          <p className="mt-1 text-xs text-ink-500">Successfully completed</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-soft space-y-4">
        {/* Main Search & Select Row */}
        <div className="grid gap-3 md:grid-cols-[1fr_200px_200px] items-center">
          {/* Instant Search input */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, name, phone, email, or city..."
              className={`${inputClass} h-11 pl-10 pr-12 w-full text-sm`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-cream-100 px-2 py-0.5 text-xs text-ink-500 hover:text-maroon-800 font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className={`${inputClass} h-11 w-full text-sm font-medium`}
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid Online</option>
            <option value="pending">Pending</option>
            <option value="cod">Cash on Delivery</option>
            <option value="failed">Failed</option>
          </select>

          {/* Status Selector */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
            className={`${inputClass} h-11 w-full text-sm font-medium capitalize`}
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-cream-100 text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 font-semibold transition-all ${
              filter === "all"
                ? "bg-maroon-800 text-cream-50 shadow-sm"
                : "bg-cream-100/80 text-ink-700 hover:bg-cream-200"
            }`}
          >
            All Orders ({orders.length})
          </button>
          {STATUSES.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`shrink-0 rounded-full px-4 py-1.5 font-semibold capitalize transition-all ${
                  filter === s
                    ? "bg-maroon-800 text-cream-50 shadow-sm"
                    : "bg-cream-100/80 text-ink-700 hover:bg-cream-200"
                }`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={26} />}
          title="No orders found"
          text={
            orders.length === 0
              ? "Orders placed on the storefront will show up here."
              : "No orders match your search query or filter selection."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50/70 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3.5 font-bold">Order ID</th>
                  <th className="px-4 py-3.5 font-bold">Customer</th>
                  <th className="px-4 py-3.5 font-bold">Date</th>
                  <th className="px-4 py-3.5 font-bold">Items</th>
                  <th className="px-4 py-3.5 font-bold">Payment</th>
                  <th className="px-4 py-3.5 font-bold">Total</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 text-center font-bold">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filtered.map((o) => {
                  const shortId = o.id.replace(/^ord_/, "").toUpperCase().slice(0, 8);
                  const firstItemName = o.items?.[0]?.name || "Item";
                  const extraCount = (o.items?.length ?? 0) - 1;
                  const itemSummary = extraCount > 0 ? `${firstItemName} + ${extraCount} more` : firstItemName;
                  const customerInitial = (o.customerName || "C").charAt(0).toUpperCase();

                  return (
                    <tr key={o.id} className="hover:bg-cream-50/70 transition-colors">
                      {/* Order ID */}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-maroon-900">
                        #{shortId}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-maroon-800/10 font-bold text-maroon-800 text-xs">
                            {customerInitial}
                          </span>
                          <div>
                            <p className="font-semibold text-maroon-900">{o.customerName || "Customer"}</p>
                            <p className="text-xs text-ink-500">{o.customerPhone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-ink-500 whitespace-nowrap">
                        {formatDate(o.createdAt)}
                      </td>

                      {/* Items summary */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="truncate text-xs font-medium text-ink-700" title={itemSummary}>
                          {itemSummary}
                        </p>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <Badge tone={PAYMENT_TONE[o.paymentStatus] ?? "muted"}>
                          {o.paymentMethod === "cod"
                            ? "COD"
                            : o.paymentStatus === "paid"
                              ? "Paid online"
                              : o.paymentStatus}
                        </Badge>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 font-bold text-maroon-900 whitespace-nowrap">
                        {formatINR(o.total)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3.5">
                        <select
                          value={o.status}
                          onChange={(e) => void handleStatusChange(o, e.target.value as OrderStatus)}
                          className="h-8 rounded-lg border border-cream-300 bg-white px-2 text-xs font-semibold capitalize text-ink-800 focus:border-maroon-800 focus:outline-none"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="capitalize">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Quick Action Icons */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setViewing(o)}
                            title="View order details"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-200 bg-white text-ink-600 hover:border-maroon-800 hover:bg-maroon-800/5 hover:text-maroon-800 transition-colors"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Quick 3-inch thermal slip print */}
                          <button
                            type="button"
                            onClick={() => printThermalReceipt(o)}
                            title="Print 3-inch thermal slip"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-200 bg-white text-ink-600 hover:border-maroon-800 hover:bg-maroon-800/5 hover:text-maroon-800 transition-colors"
                          >
                            <Printer size={15} />
                          </button>

                          {/* Quick A4 Full Page Invoice print */}
                          <button
                            type="button"
                            onClick={() => printFullInvoice(o)}
                            title="Print/Download A4 Invoice"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-200 bg-white text-ink-600 hover:border-maroon-800 hover:bg-maroon-800/5 hover:text-maroon-800 transition-colors"
                          >
                            <FileText size={15} />
                          </button>

                          {/* Quick WhatsApp message */}
                          <a
                            href={waLinkToPhone(o.customerPhone, buildAdminCustomerWhatsAppMessage(o))}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Message customer via WhatsApp"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            <MessageCircle size={15} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Shipping prompt when marking shipped */}
      {shippingPrompt && (
        <Modal
          title="Shipping Details Required"
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
              placeholder="Delivery company (e.g. Delhivery, Blue Dart, DTDC)"
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

      {/* Modal: View Order Details */}
      {viewing && (
        <Modal
          title={`Order #${viewing.id.replace(/^ord_/, "").toUpperCase().slice(0, 8)}`}
          onClose={() => {
            setViewing(null);
            setPromptError("");
          }}
        >
          <div className="space-y-5">
            {/* Top overview row */}
            <div className="flex flex-wrap justify-between gap-3 text-sm rounded-xl bg-cream-50 p-4 border border-cream-200">
              <div>
                <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Customer Info</span>
                <p className="mt-1 font-bold text-maroon-900 text-base">{viewing.customerName || "Customer"}</p>
                <p className="text-ink-600 font-medium">Ph: {viewing.customerPhone}</p>
                {viewing.customerEmail && <p className="text-ink-500 text-xs">{viewing.customerEmail}</p>}
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Order Status</span>
                <p className="mt-1 text-xs text-ink-500">{formatDate(viewing.createdAt)}</p>
                <div className="mt-1.5 flex justify-end gap-2">
                  <Badge tone={PAYMENT_TONE[viewing.paymentStatus] ?? "muted"}>
                    {viewing.paymentMethod === "cod"
                      ? "COD"
                      : viewing.paymentStatus === "paid"
                        ? "Paid online"
                        : viewing.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {viewing.shippingAddress && (
              <div className="rounded-xl border border-cream-200 bg-white p-4 text-sm">
                <p className="font-bold text-maroon-900">Delivery Address</p>
                <p className="mt-1 text-ink-700">
                  {viewing.shippingAddress.line1}
                  {viewing.shippingAddress.line2 ? `, ${viewing.shippingAddress.line2}` : ""}
                </p>
                <p className="text-ink-600">
                  {viewing.shippingAddress.district ? `${viewing.shippingAddress.district}, ` : ""}
                  {viewing.shippingAddress.city}, {viewing.shippingAddress.state} {viewing.shippingAddress.pincode}
                </p>
                {viewing.notes && (
                  <div className="mt-2.5 rounded-lg bg-saffron-50 p-2.5 text-xs text-maroon-900 border border-saffron-200">
                    <strong>Customer Note:</strong> {viewing.notes}
                  </div>
                )}
              </div>
            )}

            {/* Courier & Shipping Update */}
            <div className="rounded-xl border border-cream-200 bg-white p-4 text-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-maroon-900">
                <Truck size={16} /> Shipping Status &amp; Tracking
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1">Status</label>
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
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1">Courier Company</label>
                  <input
                    value={deliveryCompany}
                    onChange={(e) => setDeliveryCompany(e.target.value)}
                    placeholder="e.g. Delhivery, Blue Dart"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-500 mb-1">Tracking / AWB #</label>
                  <input
                    value={deliveryTrackingId}
                    onChange={(e) => setDeliveryTrackingId(e.target.value)}
                    placeholder="e.g. 123456789"
                    className={inputClass}
                  />
                </div>
              </div>

              {promptError && !shippingPrompt ? <Alert>{promptError}</Alert> : null}

              <button
                type="button"
                onClick={() => void saveDeliveryDetails()}
                disabled={savingDelivery}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-maroon-800 px-5 text-xs font-semibold text-cream-50 hover:bg-maroon-700 disabled:opacity-60"
              >
                {savingDelivery ? <RefreshCw size={14} className="animate-spin" /> : null}
                {savingDelivery ? "Saving..." : "Save Shipping Details"}
              </button>
            </div>

            {/* Items List */}
            <div>
              <h4 className="font-bold text-maroon-900 text-sm mb-2">Order Items ({viewing.items.length})</h4>
              <ul className="divide-y divide-cream-200 rounded-xl border border-cream-200 bg-white">
                {viewing.items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="text-ink-800 font-medium">
                      {it.name}{" "}
                      <span className="text-xs text-ink-500 font-normal">
                        ({it.variantLabel}) × {it.quantity}
                      </span>
                    </span>
                    <span className="font-bold text-maroon-900">{formatINR(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Total Calculations */}
            <div className="space-y-1.5 text-sm bg-cream-50/50 p-4 rounded-xl border border-cream-200">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal</span>
                <span>{formatINR(viewing.subtotal)}</span>
              </div>
              {viewing.discount ? (
                <div className="flex justify-between text-leaf-600">
                  <span>Discount</span>
                  <span>−{formatINR(viewing.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-ink-600">
                <span>Shipping</span>
                <span>{viewing.shipping ? formatINR(viewing.shipping) : "Free"}</span>
              </div>
              <div className="flex justify-between border-t border-cream-200 pt-2 text-base font-bold text-maroon-900">
                <span>Total Amount</span>
                <span>{formatINR(viewing.total)}</span>
              </div>
            </div>

            {/* Receipt Print & Messaging Options */}
            <div className="grid gap-2.5 sm:grid-cols-3 pt-2">
              <button
                type="button"
                onClick={() => printThermalReceipt(viewing)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-maroon-800/30 bg-white text-xs font-bold text-maroon-900 shadow-sm hover:bg-cream-100 transition-colors"
              >
                <Printer size={16} /> 3-Inch Thermal Slip
              </button>

              <button
                type="button"
                onClick={() => printFullInvoice(viewing)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-maroon-800/30 bg-white text-xs font-bold text-maroon-900 shadow-sm hover:bg-cream-100 transition-colors"
              >
                <FileText size={16} /> Full A4 Invoice (PDF)
              </button>

              <a
                href={waLinkToPhone(viewing.customerPhone, buildAdminCustomerWhatsAppMessage(viewing))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#35B664] text-xs font-bold text-white shadow-sm hover:bg-[#2E9E57] transition-colors"
              >
                <MessageCircle size={16} /> WhatsApp Customer
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Export Orders to Excel */}
      {exportModalOpen && (
        <Modal
          title="Export Orders to Excel (CSV)"
          onClose={() => setExportModalOpen(false)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-ink-600 hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadOrdersCSV(orders, exportFilters);
                  setExportModalOpen(false);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-maroon-800 px-6 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
              >
                <Download size={16} /> Download CSV
              </button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-maroon-900">Date Range</label>
              <select
                value={exportFilters.dateRange}
                onChange={(e) =>
                  setExportFilters((f) => ({ ...f, dateRange: e.target.value as ExportFilters["dateRange"] }))
                }
                className={`${inputClass} mt-1.5`}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {exportFilters.dateRange === "custom" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-ink-600">Start Date</label>
                  <input
                    type="date"
                    value={exportFilters.startDate ?? ""}
                    onChange={(e) => setExportFilters((f) => ({ ...f, startDate: e.target.value }))}
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-600">End Date</label>
                  <input
                    type="date"
                    value={exportFilters.endDate ?? ""}
                    onChange={(e) => setExportFilters((f) => ({ ...f, endDate: e.target.value }))}
                    className={`${inputClass} mt-1`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-medium text-maroon-900">Order Status</label>
              <select
                value={exportFilters.status}
                onChange={(e) =>
                  setExportFilters((f) => ({ ...f, status: e.target.value as ExportFilters["status"] }))
                }
                className={`${inputClass} mt-1.5`}
              >
                <option value="all">All Order Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-maroon-900">Payment Status</label>
              <select
                value={exportFilters.paymentStatus}
                onChange={(e) =>
                  setExportFilters((f) => ({ ...f, paymentStatus: e.target.value as ExportFilters["paymentStatus"] }))
                }
                className={`${inputClass} mt-1.5`}
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending / Unpaid</option>
                <option value="cod">Cash on Delivery (COD)</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-maroon-900">Max Orders to Export</label>
              <select
                value={exportFilters.limit}
                onChange={(e) =>
                  setExportFilters((f) => ({
                    ...f,
                    limit: e.target.value === "all" ? "all" : Number(e.target.value),
                  }))
                }
                className={`${inputClass} mt-1.5`}
              >
                <option value="all">All Matching Orders ({orders.length})</option>
                <option value="50">Top 50 Orders</option>
                <option value="100">Top 100 Orders</option>
                <option value="250">Top 250 Orders</option>
                <option value="500">Top 500 Orders</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
