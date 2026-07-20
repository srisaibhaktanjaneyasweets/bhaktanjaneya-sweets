import { config } from "./config";
import type { CartItem, Order } from "./types";
import { formatINR } from "./utils";

/** Build an official WhatsApp deep link with a pre-filled message. */
export function waLink(message: string): string {
  const num = config.whatsappNumber.replace(/[^0-9]/g, "");
  // Normalize string to NFC to ensure proper multi-byte UTF-8 encoding of all emojis
  const normalized = message.normalize("NFC");
  return `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(normalized)}`;
}

/** Message for ordering a single product/variant from a product page. */
export function productEnquiryMessage(
  name: string,
  variantLabel: string,
  price: number,
): string {
  return [
    `Hello ${config.businessName}!`,
    "",
    `I'd like to order:`,
    `• ${name} (${variantLabel}) — ${formatINR(price)}`,
    "",
    "Please confirm availability and delivery.",
  ].join("\n");
}

/** Message that compiles the whole cart into a WhatsApp order. */
export function cartOrderMessage(
  items: CartItem[],
  opts?: { name?: string; phone?: string; subtotal?: number },
): string {
  const lines = items.map(
    (it, i) =>
      `${i + 1}. ${it.name} (${it.variantLabel}) x${it.quantity} — ${formatINR(
        it.price * it.quantity,
      )}`,
  );
  const subtotal =
    opts?.subtotal ?? items.reduce((s, it) => s + it.price * it.quantity, 0);

  const who = [
    opts?.name ? `Name: ${opts.name}` : null,
    opts?.phone ? `Phone: ${opts.phone}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    `Hello ${config.businessName}!`,
    "",
    "I'd like to place this order:",
    "",
    ...lines,
    "",
    `Subtotal: ${formatINR(subtotal)}`,
    who,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

/** Build exact formatted WhatsApp message template when an order is completed. */
export function buildFormattedWhatsAppOrderMessage(order: Partial<Order>): string {
  const rawId = order.id ?? "";
  const shortId = rawId ? rawId.replace(/^ord_/, "").toUpperCase().slice(0, 8) : "N/A";

  const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateStr = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const statusStr =
    order.paymentStatus === "paid"
      ? "Paid / Confirmed"
      : order.paymentStatus === "cod"
        ? "COD Pending"
        : order.paymentStatus || "pending";

  const itemsList = (order.items ?? [])
    .map(
      (it) =>
        `⭐ ${it.name} - ${it.variantLabel} x ${it.quantity} => ₹${it.price * it.quantity} INR`,
    )
    .join("\n");

  const addr = order.shippingAddress;
  const addressLines = [
    order.customerName,
    addr?.line1,
    addr?.line2,
    addr?.city,
    addr?.state,
    addr?.pincode,
    "IN",
    order.customerEmail,
    order.customerPhone ? `+91${order.customerPhone.replace(/\D/g, "")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const subtotal = order.subtotal ?? 0;
  const shipping = order.shipping ?? 0;
  const total = order.total ?? subtotal + shipping;
  const shippingText = shipping === 0 ? "Free Shipping" : `₹${shipping} INR`;

  const divider = "--------------------------------";

  const parts = [
    "👉 New Order Received @ ",
    "",
    divider,
    "",
    `📌 Order number    : ${shortId}`,
    `✅ Order Status    : ${statusStr}`,
    `📅 Date            : ${dateStr}`,
    `✉️ Email           : ${order.customerEmail || ""}`,
    `💵 Total Amount    : ₹${total} INR`,
    "",
    "🔎 Order details: ",
    "",
    itemsList || "No items listed",
    "",
    divider,
    "",
    `Subtotal: ₹${subtotal}`,
    `Shipping: ${shippingText}`,
    `Total: ₹${total}`,
    "",
    divider,
    "",
    "Note:",
    order.notes?.trim() || "None",
    "",
    divider,
    "",
    "📋 Billing address:",
    "",
    addressLines || "No address provided",
  ];

  return parts.join("\n");
}
