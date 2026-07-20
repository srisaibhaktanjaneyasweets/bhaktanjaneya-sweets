import type { Order, OrderStatus } from "./types";

export interface ExportFilters {
  dateRange: "all" | "today" | "7days" | "30days" | "custom";
  startDate?: string;
  endDate?: string;
  status: "all" | OrderStatus;
  paymentStatus: "all" | "paid" | "pending" | "cod" | "failed";
  limit: "all" | number;
}

export function filterOrdersForExport(orders: Order[], filters: ExportFilters): Order[] {
  let result = [...orders];

  // 1. Date filter
  const now = new Date();
  if (filters.dateRange === "today") {
    const todayStr = now.toISOString().slice(0, 10);
    result = result.filter((o) => o.createdAt && o.createdAt.slice(0, 10) === todayStr);
  } else if (filters.dateRange === "7days") {
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    result = result.filter((o) => new Date(o.createdAt) >= cutoff);
  } else if (filters.dateRange === "30days") {
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    result = result.filter((o) => new Date(o.createdAt) >= cutoff);
  } else if (filters.dateRange === "custom" && (filters.startDate || filters.endDate)) {
    const start = filters.startDate ? new Date(filters.startDate) : new Date(0);
    const end = filters.endDate ? new Date(filters.endDate + "T23:59:59") : new Date();
    result = result.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });
  }

  // 2. Status filter
  if (filters.status !== "all") {
    result = result.filter((o) => o.status === filters.status);
  }

  // 3. Payment status filter
  if (filters.paymentStatus !== "all") {
    result = result.filter((o) => o.paymentStatus === filters.paymentStatus);
  }

  // 4. Limit filter
  if (filters.limit !== "all" && typeof filters.limit === "number") {
    result = result.slice(0, filters.limit);
  }

  return result;
}

function escapeCSV(val: unknown): string {
  if (val == null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function downloadOrdersCSV(orders: Order[], filters: ExportFilters) {
  const filtered = filterOrdersForExport(orders, filters);

  const headers = [
    "Order ID",
    "Date & Time",
    "Customer Name",
    "Customer Phone",
    "Customer Email",
    "Address Line 1",
    "Address Line 2",
    "City",
    "State",
    "Pincode",
    "Items Summary",
    "Item Count",
    "Subtotal (INR)",
    "Shipping (INR)",
    "Discount (INR)",
    "Total Amount (INR)",
    "Payment Method",
    "Payment Status",
    "Order Status",
    "Delivery Courier",
    "Tracking ID",
    "Special Notes",
  ];

  const rows = filtered.map((o) => {
    const shortId = o.id.replace(/^ord_/, "").toUpperCase().slice(0, 8);
    const dateStr = new Date(o.createdAt).toLocaleString("en-IN");
    const addr = o.shippingAddress;
    const itemsSummary = (o.items ?? [])
      .map((it) => `${it.name} (${it.variantLabel}) x${it.quantity}`)
      .join(" | ");

    return [
      escapeCSV(shortId),
      escapeCSV(dateStr),
      escapeCSV(o.customerName || ""),
      escapeCSV(o.customerPhone || ""),
      escapeCSV(o.customerEmail || ""),
      escapeCSV(addr?.line1 || ""),
      escapeCSV(addr?.line2 || ""),
      escapeCSV(addr?.city || ""),
      escapeCSV(addr?.state || ""),
      escapeCSV(addr?.pincode || ""),
      escapeCSV(itemsSummary),
      escapeCSV(o.items?.length ?? 0),
      escapeCSV(o.subtotal),
      escapeCSV(o.shipping ?? 0),
      escapeCSV(o.discount ?? 0),
      escapeCSV(o.total),
      escapeCSV(o.paymentMethod || ""),
      escapeCSV(o.paymentStatus || ""),
      escapeCSV(o.status || ""),
      escapeCSV(o.deliveryCompany || ""),
      escapeCSV(o.deliveryTrackingId || ""),
      escapeCSV(o.notes || ""),
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateTag = new Date().toISOString().slice(0, 10);

  link.setAttribute("href", url);
  link.setAttribute("download", `bhaktanjaneya_orders_${dateTag}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
