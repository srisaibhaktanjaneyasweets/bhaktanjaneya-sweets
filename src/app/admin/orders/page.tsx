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
  FileText,
  RefreshCw,
  Smartphone,
  Share2,
  Copy,
  CreditCard,
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { EmptyState, Modal, inputClass, AdminButton } from "@/components/admin/ui";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api/errors";
import { formatINR } from "@/lib/utils";
import { waLinkToPhone, buildAdminCustomerWhatsAppMessage, buildAdminCustomerPaymentLinkMessage, buildShipmentWhatsAppMessage, buildDeliveryWhatsAppMessage } from "@/lib/whatsapp";
import {
  printThermalReceipt,
  printFullInvoice,
  generatePlainTextReceipt,
  openRawBtPrintApp,
} from "@/lib/thermal-receipt";
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
  whatsapp: "saffron",
};

const formatOrderDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) + " IST";
};

const getStatusSelectClass = (status: OrderStatus) => {
  const base = "h-8 rounded-full border pl-3 pr-7 text-xs font-bold capitalize focus:outline-none transition-all cursor-pointer shadow-xs appearance-none bg-[right_8px_center] bg-no-repeat bg-[length:12px] ";
  switch (status) {
    case "new":
      return base + "bg-blue-50 text-blue-700 border-blue-200 focus:border-blue-500 hover:bg-blue-100/70 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231d4ed8%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')]";
    case "confirmed":
      return base + "bg-indigo-50 text-indigo-700 border-indigo-200 focus:border-indigo-500 hover:bg-indigo-100/70 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234338ca%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')]";
    case "packed":
      return base + "bg-purple-50 text-purple-700 border-purple-200 focus:border-purple-500 hover:bg-purple-100/70 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%237e22ce%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')]";
    case "shipped":
      return base + "bg-amber-50 text-amber-700 border-amber-200 focus:border-amber-500 hover:bg-amber-100/70 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23b45309%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')]";
    case "delivered":
      return base + "bg-emerald-50 text-emerald-700 border-emerald-200 focus:border-emerald-500 hover:bg-emerald-100/70 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23047857%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')]";
    case "cancelled":
      return base + "bg-rose-50 text-rose-700 border-rose-200 focus:border-rose-500 hover:bg-rose-100/70 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23be123c%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')]";
    default:
      return base + "bg-white text-ink-800 border-cream-300 focus:border-maroon-800 hover:bg-cream-50 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')]";
  }
};

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, updateOrder } = useAdmin();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewing, setViewing] = useState<Order | null>(null);
  const [bluetoothReceiptModal, setBluetoothReceiptModal] = useState<Order | null>(null);
  const [bizConfig, setBizConfig] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings/business")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBizConfig(data);
      })
      .catch(() => {});
  }, []);

  const [deliveryCompany, setDeliveryCompany] = useState("");
  const [deliveryCustomName, setDeliveryCustomName] = useState("");
  const [deliveryCustomLink, setDeliveryCustomLink] = useState("");
  const [deliveryTrackingId, setDeliveryTrackingId] = useState("");
  const [modalStatus, setModalStatus] = useState<OrderStatus>("new");
  const [savingDelivery, setSavingDelivery] = useState(false);

  const [shippingPrompt, setShippingPrompt] = useState<Order | null>(null);
  const [promptCompany, setPromptCompany] = useState("");
  const [promptCustomName, setPromptCustomName] = useState("");
  const [promptCustomLink, setPromptCustomLink] = useState("");
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
    const rawCompany = viewing.deliveryCompany ?? "";
    if (rawCompany.includes("|")) {
      const [name, link] = rawCompany.split("|");
      setDeliveryCompany("other");
      setDeliveryCustomName(name);
      setDeliveryCustomLink(link);
    } else if (["world first", "DTDC", "APSRTC", "TSRTC", ""].includes(rawCompany)) {
      setDeliveryCompany(rawCompany);
      setDeliveryCustomName("");
      setDeliveryCustomLink("");
    } else {
      setDeliveryCompany("other");
      setDeliveryCustomName(rawCompany);
      setDeliveryCustomLink("");
    }
    setDeliveryTrackingId(viewing.deliveryTrackingId ?? "");
    setModalStatus(viewing.status);
  }, [viewing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleStatusChange(order: Order, nextStatus: OrderStatus) {
    if (nextStatus === "shipped") {
      setShippingPrompt(order);
      const rawCompany = order.deliveryCompany ?? "";
      if (rawCompany.includes("|")) {
        const [name, link] = rawCompany.split("|");
        setPromptCompany("other");
        setPromptCustomName(name);
        setPromptCustomLink(link);
      } else if (["world first", "DTDC", "APSRTC", "TSRTC", ""].includes(rawCompany)) {
        setPromptCompany(rawCompany);
        setPromptCustomName("");
        setPromptCustomLink("");
      } else {
        setPromptCompany("other");
        setPromptCustomName(rawCompany);
        setPromptCustomLink("");
      }
      setPromptTracking(order.deliveryTrackingId ?? "");
      setPromptError("");
      return;
    }

    try {
      await updateOrderStatus(order.id, nextStatus);
      if (nextStatus === "delivered") {
        const message = buildDeliveryWhatsAppMessage(order);
        const url = waLinkToPhone(order.customerPhone, message);
        window.open(url, "_blank");
      }
    } catch (error) {
      setPromptError(getErrorMessage(error, "Could not update order status."));
    }
  }

  async function handleMarkPaid(order: Order) {
    if (typeof window === "undefined" || !window.confirm("Are you sure you want to manually mark this order as paid?")) return;
    try {
      await updateOrder(order.id, { paymentStatus: "paid" });
      toast({
        tone: "success",
        title: "Payment updated",
        message: "Order marked as paid successfully.",
      });
      if (viewing && viewing.id === order.id) {
        setViewing((prev) => prev ? { ...prev, paymentStatus: "paid" } : null);
      }
    } catch (error) {
      toast({
        tone: "error",
        title: "Update failed",
        message: getErrorMessage(error, "Could not update payment status."),
      });
    }
  }

  async function confirmShipped() {
    if (!shippingPrompt) return;
    const tracking = promptTracking.trim();
    let company = promptCompany.trim();
    if (company === "other") {
      company = promptCustomName.trim();
      if (promptCustomLink.trim()) {
        company = `${promptCustomName.trim()}|${promptCustomLink.trim()}`;
      }
    }

    setPromptSaving(true);
    setPromptError("");
    try {
      await updateOrderStatus(shippingPrompt.id, "shipped", {
        deliveryCompany: company || undefined,
        deliveryTrackingId: tracking || undefined,
      });

      const message = buildShipmentWhatsAppMessage(shippingPrompt, company || undefined, tracking || undefined, bizConfig?.whatsappShipmentTemplate);
      const url = waLinkToPhone(shippingPrompt.customerPhone, message);
      window.open(url, "_blank");

      setShippingPrompt(null);
    } catch (error) {
      setPromptError(getErrorMessage(error, "Could not mark order as shipped."));
    } finally {
      setPromptSaving(false);
    }
  }

  async function saveDeliveryDetails() {
    if (!viewing) return;

    setSavingDelivery(true);
    setPromptError("");
    try {
      let company = deliveryCompany.trim();
      if (company === "other") {
        company = deliveryCustomName.trim();
        if (deliveryCustomLink.trim()) {
          company = `${deliveryCustomName.trim()}|${deliveryCustomLink.trim()}`;
        }
      }

      const next = await updateOrder(viewing.id, {
        status: modalStatus,
        deliveryCompany: company || undefined,
        deliveryTrackingId: deliveryTrackingId.trim() || undefined,
      });

      if (modalStatus === "shipped") {
        const message = buildShipmentWhatsAppMessage(next, company || undefined, deliveryTrackingId.trim() || undefined, bizConfig?.whatsappShipmentTemplate);
        const url = waLinkToPhone(next.customerPhone, message);
        window.open(url, "_blank");
      } else if (modalStatus === "delivered") {
        const message = buildDeliveryWhatsAppMessage(next, bizConfig?.whatsappDeliveryTemplate);
        const url = waLinkToPhone(next.customerPhone, message);
        window.open(url, "_blank");
      }

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
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-ink-700">
                <thead className="border-b border-cream-200 bg-cream-50/70 text-left text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Order ID</th>
                    <th className="px-4 py-3.5 font-bold">Customer</th>
                    <th className="px-4 py-3.5 font-bold">Date</th>
                    <th className="px-4 py-3.5 font-bold">Payment</th>
                    <th className="px-4 py-3.5 font-bold">Total</th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                    <th className="px-4 py-3.5 text-center font-bold">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 bg-white">
                  {filtered.map((o) => {
                    const shortId = o.id.replace(/^ord_/, "").toUpperCase().slice(0, 8);
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
                          {formatOrderDateTime(o.createdAt)}
                        </td>

                        {/* Payment */}
                        <td className="px-4 py-3.5">
                          <Badge tone={o.paymentMethod === "whatsapp" ? "saffron" : (PAYMENT_TONE[o.paymentStatus] ?? "muted")}>
                            {o.paymentMethod === "cod"
                              ? "COD"
                              : o.paymentMethod === "whatsapp"
                                ? "WhatsApp (Pending)"
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
                            className={getStatusSelectClass(o.status)}
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
                          <div className="flex items-center justify-center gap-1.5 min-w-[180px] flex-nowrap">
                            {/* View details */}
                            <button
                              type="button"
                              onClick={() => setViewing(o)}
                              title="View order details"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-200 bg-white text-ink-600 hover:border-maroon-800 hover:bg-maroon-800/5 hover:text-maroon-800 transition-colors cursor-pointer"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Quick Bluetooth thermal app print */}
                            <button
                              type="button"
                              onClick={() => setBluetoothReceiptModal(o)}
                              title="Bluetooth Thermal App Print (RawBT / App Share)"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-saffron-300 bg-saffron-50 text-saffron-800 hover:bg-saffron-500 hover:text-white transition-colors cursor-pointer"
                            >
                              <Printer size={15} />
                            </button>

                            {/* Quick A4 Full Page Invoice print */}
                            <button
                              type="button"
                              onClick={() => printFullInvoice(o, bizConfig)}
                              title="Print/Download A4 Invoice"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-200 bg-white text-ink-600 hover:border-maroon-800 hover:bg-maroon-800/5 hover:text-maroon-800 transition-colors cursor-pointer"
                            >
                              <FileText size={15} />
                            </button>

                            {/* Quick WhatsApp message */}
                            <a
                              href={waLinkToPhone(
                                o.customerPhone,
                                o.status === "shipped"
                                  ? buildShipmentWhatsAppMessage(o, o.deliveryCompany, o.deliveryTrackingId, bizConfig?.whatsappShipmentTemplate)
                                  : o.status === "delivered"
                                    ? buildDeliveryWhatsAppMessage(o, bizConfig?.whatsappDeliveryTemplate)
                                    : buildAdminCustomerWhatsAppMessage(o)
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Message customer via WhatsApp"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                            >
                              <MessageCircle size={15} />
                            </a>

                            {/* WhatsApp Payment Link */}
                            {o.paymentStatus === "pending" && o.status !== "cancelled" && (
                              <a
                                href={waLinkToPhone(o.customerPhone, buildAdminCustomerPaymentLinkMessage(o))}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Send Payment Link via WhatsApp"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white transition-colors"
                              >
                                <CreditCard size={15} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="block md:hidden space-y-4">
            {filtered.map((o) => {
              const shortId = o.id.replace(/^ord_/, "").toUpperCase().slice(0, 8);
              const firstItemName = o.items?.[0]?.name || "Item";
              const extraCount = (o.items?.length ?? 0) - 1;
              const itemSummary = extraCount > 0 ? `${firstItemName} + ${extraCount} more` : firstItemName;

              return (
                <div key={o.id} className="rounded-2xl border border-cream-200 bg-white p-4.5 shadow-soft space-y-3.5">
                  {/* Card Header: Order ID & Date */}
                  <div className="flex items-center justify-between border-b border-cream-100 pb-2.5">
                    <span className="font-mono text-xs font-bold text-maroon-900 bg-maroon-50 px-2 py-0.5 rounded">
                      #{shortId}
                    </span>
                    <span className="text-[10px] text-ink-500 font-medium">
                      {formatOrderDateTime(o.createdAt)}
                    </span>
                  </div>

                  {/* Customer Info row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-ink-800">{o.customerName || "Customer"}</p>
                      <p className="text-xs text-ink-500 font-medium">{o.customerPhone}</p>
                    </div>
                    {/* Direct WhatsApp Message Link */}
                    <a
                      href={waLinkToPhone(
                        o.customerPhone,
                        o.status === "shipped"
                          ? buildShipmentWhatsAppMessage(o, o.deliveryCompany, o.deliveryTrackingId, bizConfig?.whatsappShipmentTemplate)
                          : o.status === "delivered"
                            ? buildDeliveryWhatsAppMessage(o, bizConfig?.whatsappDeliveryTemplate)
                            : buildAdminCustomerWhatsAppMessage(o)
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 px-2.5 items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <MessageCircle size={12} /> Chat
                    </a>
                  </div>

                  {/* Order Items summary box */}
                  <div className="rounded-xl bg-cream-50/50 border border-cream-100/50 p-2.5 text-xs text-ink-750 font-medium">
                    <p className="text-[10px] uppercase font-bold text-ink-400 tracking-wider mb-1">Items</p>
                    <p>{itemSummary}</p>
                  </div>

                  {/* Pricing, Payment & Status line */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-cream-50/30 p-2 rounded-xl border border-cream-100">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-bold text-ink-400 tracking-wider">Total Amount</p>
                      <p className="text-base font-black text-maroon-900">{formatINR(o.total)}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge tone={o.paymentMethod === "whatsapp" ? "saffron" : (PAYMENT_TONE[o.paymentStatus] ?? "muted")} className="text-[10px]">
                        {o.paymentMethod === "cod"
                          ? "COD"
                          : o.paymentMethod === "whatsapp"
                            ? "WhatsApp (Pending)"
                            : o.paymentStatus === "paid"
                              ? "Paid online"
                              : o.paymentStatus}
                      </Badge>
                      
                      <select
                        value={o.status}
                        onChange={(e) => void handleStatusChange(o, e.target.value as OrderStatus)}
                        className={getStatusSelectClass(o.status)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Action Buttons Row */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-cream-100">
                    <button
                      type="button"
                      onClick={() => setViewing(o)}
                      className="flex h-8 items-center gap-1.5 px-3 rounded-lg border border-cream-200 bg-white text-xs font-bold text-ink-600 hover:border-maroon-800 hover:bg-maroon-800/5 hover:text-maroon-800 transition-colors cursor-pointer"
                    >
                      <Eye size={14} /> View
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setBluetoothReceiptModal(o)}
                      className="flex h-8 items-center gap-1.5 px-3 rounded-lg border border-saffron-300 bg-saffron-50 text-xs font-bold text-saffron-800 hover:bg-saffron-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <Printer size={14} /> Slip
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => printFullInvoice(o, bizConfig)}
                      className="flex h-8 items-center gap-1.5 px-3 rounded-lg border border-cream-200 bg-white text-xs font-bold text-ink-600 hover:border-maroon-800 hover:bg-maroon-800/5 hover:text-maroon-800 transition-colors cursor-pointer"
                    >
                      <FileText size={14} /> A4
                    </button>

                    {o.paymentStatus === "pending" && o.status !== "cancelled" && (
                      <a
                        href={waLinkToPhone(o.customerPhone, buildAdminCustomerPaymentLinkMessage(o))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 items-center gap-1.5 px-3 rounded-lg border border-amber-300 bg-amber-50 text-xs font-bold text-amber-700 hover:bg-amber-600 hover:text-white transition-colors"
                      >
                        <CreditCard size={14} /> Pay Link
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Shipping prompt when marking shipped */}
      {shippingPrompt && (
        <Modal
          title="Enter Shipping Details (Optional)"
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
            {shippingPrompt.id.replace(/^ord_/, "").toUpperCase().slice(0, 8)} (optional, you can leave these blank and proceed).
          </p>
          <div className="mt-4 space-y-3">
            <select
              value={promptCompany}
              onChange={(e) => {
                const val = e.target.value;
                setPromptCompany(val);
                if (val !== "other") {
                  setPromptCustomName("");
                  setPromptCustomLink("");
                }
              }}
              className={inputClass}
            >
              <option value="">Select courier company (optional)</option>
              <option value="world first">world first</option>
              <option value="DTDC">DTDC</option>
              <option value="APSRTC">APSRTC</option>
              <option value="TSRTC">TSRTC</option>
              <option value="other">Other / Custom...</option>
              {promptCompany && !["world first", "DTDC", "APSRTC", "TSRTC", "other", ""].includes(promptCompany) && (
                <option value={promptCompany}>{promptCompany}</option>
              )}
            </select>

            {promptCompany === "other" && (
              <div className="space-y-3 mt-3 border-l-2 border-cream-300 pl-3">
                <input
                  required
                  value={promptCustomName}
                  onChange={(e) => setPromptCustomName(e.target.value)}
                  placeholder="Custom courier company name (e.g. Blue Dart)"
                  className={inputClass}
                />
                <input
                  value={promptCustomLink}
                  onChange={(e) => setPromptCustomLink(e.target.value)}
                  placeholder="Custom tracking link route (e.g. https://bluedart.com/track?id=TRACKING_ID)"
                  className={inputClass}
                />
                <p className="text-[10px] text-ink-400">
                  Optional. Use <strong>TRACKING_ID</strong> as placeholder for tracking ID inside your URL.
                </p>
              </div>
            )}

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
                <p className="mt-1 text-xs text-ink-500">{formatOrderDateTime(viewing.createdAt)}</p>
                <div className="mt-1.5 flex items-center justify-end gap-2 flex-wrap">
                  <Badge tone={viewing.paymentMethod === "whatsapp" ? "saffron" : (PAYMENT_TONE[viewing.paymentStatus] ?? "muted")}>
                    {viewing.paymentMethod === "cod"
                      ? "COD"
                      : viewing.paymentMethod === "whatsapp"
                        ? "WhatsApp (Pending)"
                        : viewing.paymentStatus === "paid"
                          ? "Paid online"
                          : viewing.paymentStatus}
                  </Badge>
                  {viewing.paymentStatus === "pending" && viewing.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => void handleMarkPaid(viewing)}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {viewing.shippingAddress && (
              <div className="rounded-xl border border-cream-200 bg-white p-4 text-sm space-y-1">
                <p className="font-bold text-maroon-900 mb-1.5">Delivery Address</p>
                <p className="text-ink-700 font-semibold">STREET: {viewing.shippingAddress.line1.toUpperCase()}</p>
                {viewing.shippingAddress.line2 && (
                  <p className="text-ink-700 font-semibold">AREA: {viewing.shippingAddress.line2.toUpperCase()}</p>
                )}
                <p className="text-ink-700 font-semibold">CITY: {viewing.shippingAddress.city.toUpperCase()}</p>
                <p className="text-ink-700 font-semibold">STATE: {viewing.shippingAddress.state.toUpperCase()} - {viewing.shippingAddress.pincode}</p>
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
                  <select
                    value={deliveryCompany}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDeliveryCompany(val);
                      if (val !== "other") {
                        setDeliveryCustomName("");
                        setDeliveryCustomLink("");
                      }
                    }}
                    className={inputClass}
                  >
                    <option value="">Select courier company (optional)</option>
                    <option value="world first">world first</option>
                    <option value="DTDC">DTDC</option>
                    <option value="APSRTC">APSRTC</option>
                    <option value="TSRTC">TSRTC</option>
                    <option value="other">Other / Custom...</option>
                    {deliveryCompany && !["world first", "DTDC", "APSRTC", "TSRTC", "other", ""].includes(deliveryCompany) && (
                      <option value={deliveryCompany}>{deliveryCompany}</option>
                    )}
                  </select>
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

              {deliveryCompany === "other" && (
                <div className="grid gap-3 sm:grid-cols-2 mt-3 pt-3 border-t border-cream-100">
                  <div>
                    <label className="block text-xs font-medium text-ink-500 mb-1">Custom Courier Name</label>
                    <input
                      required
                      value={deliveryCustomName}
                      onChange={(e) => setDeliveryCustomName(e.target.value)}
                      placeholder="Custom courier company name (e.g. Blue Dart)"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-500 mb-1">Custom Tracking Link Route</label>
                    <input
                      value={deliveryCustomLink}
                      onChange={(e) => setDeliveryCustomLink(e.target.value)}
                      placeholder="Custom tracking link (e.g. https://bluedart.com/track?id=TRACKING_ID)"
                      className={inputClass}
                    />
                  </div>
                  <p className="text-[10px] text-ink-400 sm:col-span-2">
                    Optional. Use <strong>TRACKING_ID</strong> as placeholder for tracking ID inside your URL.
                  </p>
                </div>
              )}

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
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <button
                type="button"
                onClick={() => setBluetoothReceiptModal(viewing)}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-saffron-500/60 bg-saffron-500/10 text-xs font-bold text-maroon-900 shadow-sm hover:bg-saffron-500/20 transition-colors"
              >
                <Smartphone size={16} className="text-saffron-600 shrink-0" /> Bluetooth Thermal App
              </button>

              <button
                type="button"
                onClick={() => printThermalReceipt(viewing, bizConfig)}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-maroon-800/30 bg-white text-xs font-bold text-maroon-900 shadow-sm hover:bg-cream-100 transition-colors"
              >
                <Printer size={16} className="shrink-0" /> 3-Inch Slip (Browser)
              </button>

              <button
                type="button"
                onClick={() => printFullInvoice(viewing, bizConfig)}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-maroon-800/30 bg-white text-xs font-bold text-maroon-900 shadow-sm hover:bg-cream-100 transition-colors"
              >
                <FileText size={16} className="shrink-0" /> Full A4 Invoice
              </button>

              <a
                href={waLinkToPhone(
                  viewing.customerPhone,
                  viewing.status === "shipped"
                    ? buildShipmentWhatsAppMessage(viewing, viewing.deliveryCompany, viewing.deliveryTrackingId, bizConfig?.whatsappShipmentTemplate)
                    : viewing.status === "delivered"
                      ? buildDeliveryWhatsAppMessage(viewing, bizConfig?.whatsappDeliveryTemplate)
                      : buildAdminCustomerWhatsAppMessage(viewing)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#35B664] text-xs font-bold text-white shadow-sm hover:bg-[#2E9E57] transition-colors"
              >
                <MessageCircle size={16} className="shrink-0" /> WhatsApp Customer
              </a>

              {viewing.paymentStatus === "pending" && viewing.status !== "cancelled" && (
                <a
                  href={waLinkToPhone(viewing.customerPhone, buildAdminCustomerPaymentLinkMessage(viewing))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-amber-600 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
                >
                  <CreditCard size={16} className="shrink-0" /> Share Payment Link
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Bluetooth Thermal Printer App Options */}
      {bluetoothReceiptModal && (
        <Modal
          title="Bluetooth Thermal App Print"
          onClose={() => setBluetoothReceiptModal(null)}
          footer={
            <button
              type="button"
              onClick={() => setBluetoothReceiptModal(null)}
              className="inline-flex h-10 items-center rounded-full bg-cream-200 px-6 text-sm font-semibold text-ink-700 hover:bg-cream-300"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-ink-600">
              Choose how to send the receipt for Order #<strong>{bluetoothReceiptModal.id.replace(/^ord_/, "").toUpperCase().slice(0, 8)}</strong> to your Bluetooth Thermal Printer App (RawBT, Bluetooth POS Printer, ESC/POS Service):
            </p>

            {/* Print Action Buttons */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  const text = generatePlainTextReceipt(bluetoothReceiptModal);
                  if (navigator.share) {
                    navigator
                      .share({
                        title: `Receipt #${bluetoothReceiptModal.id.replace(/^ord_/, "").toUpperCase().slice(0, 8)}`,
                        text,
                      })
                      .catch(() => {});
                  } else {
                    toast({
                      tone: "info",
                      title: "Sharing Not Supported",
                      message: "Use RawBT App Direct Print or Copy Text below.",
                    });
                  }
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-maroon-900 px-4 text-xs font-bold text-cream-50 hover:bg-maroon-800 shadow-md transition-colors"
              >
                <Share2 size={16} /> Share to Bluetooth Printer App
              </button>

              <button
                type="button"
                onClick={() => openRawBtPrintApp(bluetoothReceiptModal, bizConfig)}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-saffron-500 bg-saffron-500/10 px-4 text-xs font-bold text-maroon-900 hover:bg-saffron-500/20 shadow-sm transition-colors"
              >
                <Smartphone size={16} className="text-saffron-600" /> Open RawBT App Direct
              </button>
            </div>

            {/* Secondary Options: Copy Text & Download File */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const text = generatePlainTextReceipt(bluetoothReceiptModal, true, bizConfig);
                  let success = false;

                  try {
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    textArea.style.top = "0";
                    textArea.style.left = "0";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    success = document.execCommand("copy");
                    document.body.removeChild(textArea);
                  } catch {
                    success = false;
                  }

                  if (!success && navigator.clipboard) {
                    navigator.clipboard.writeText(text);
                    success = true;
                  }

                  toast({
                    tone: success ? "success" : "info",
                    title: success ? "Receipt Copied!" : "Copy failed",
                    message: success
                      ? "Receipt text copied to clipboard. You can paste it in any printer app."
                      : "Could not copy automatically. You can copy the text from the preview box below.",
                  });
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-3.5 text-xs font-semibold text-ink-800 hover:bg-cream-100 transition-colors"
              >
                <Copy size={14} /> Copy Receipt Text
              </button>

              <button
                type="button"
                onClick={() => {
                  const text = generatePlainTextReceipt(bluetoothReceiptModal, true);
                  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Receipt-${bluetoothReceiptModal.id.replace(/^ord_/, "").toUpperCase().slice(0, 8)}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-3.5 text-xs font-semibold text-ink-800 hover:bg-cream-100 transition-colors"
              >
                <Download size={14} /> Download .txt File
              </button>
            </div>

            {/* Text Preview Box */}
            <div className="space-y-1 pt-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Thermal Receipt Text Preview
              </label>
              <textarea
                readOnly
                rows={12}
                value={generatePlainTextReceipt(bluetoothReceiptModal, true)}
                className="w-full rounded-2xl border border-cream-300 bg-cream-50/80 p-3.5 font-mono text-[13px] font-bold text-ink-950 focus:outline-none"
              />
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
