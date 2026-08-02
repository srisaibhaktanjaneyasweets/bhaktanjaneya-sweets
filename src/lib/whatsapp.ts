import { config } from "./config";
import type { CartItem, Order } from "./types";
import { formatINR } from "./utils";

/** Ensure phone number is in standard international 91XXXXXXXXXX format for WhatsApp API. */
export function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = (phone || "").replace(/[^0-9]/g, "");
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = `91${cleaned.slice(1)}`;
  }
  return cleaned;
}

/** Build an official WhatsApp deep link with a pre-filled message for store support. */
export function waLink(message: string): string {
  const num = formatPhoneForWhatsApp(config.whatsappNumber);
  const normalized = message.normalize("NFC");
  return `https://wa.me/${num}?text=${encodeURIComponent(normalized)}`;
}

/** Build a WhatsApp deep link targeting a specific customer phone number. */
export function waLinkToPhone(phone: string, message: string): string {
  const num = formatPhoneForWhatsApp(phone);
  const normalized = message.normalize("NFC");
  return `https://wa.me/${num}?text=${encodeURIComponent(normalized)}`;
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
  const dateStr = dateObj.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) + " IST";

  const statusStr =
    order.paymentStatus === "paid"
      ? "Paid / Confirmed"
      : order.paymentStatus === "cod"
        ? "COD Pending"
        : order.paymentStatus || "pending";

  const itemsList = (order.items ?? [])
    .map(
      (it, idx) =>
        `⭐ ${idx + 1}. ${it.name} - ${it.variantLabel} x ${it.quantity} => ₹${it.price * it.quantity} INR`,
    )
    .join("\n");

  const addr = order.shippingAddress;
  const addressLines = addr
    ? [
        `STREET ADDRESS : ${addr.line1}`,
        addr.line2 ? `AREA           : ${addr.line2}` : null,
        `CITY           : ${addr.city}`,
        `STATE          : ${addr.state}`,
        `PINCODE        : ${addr.pincode}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "NO ADDRESS PROVIDED";

  const customerDetails = [
    `NAME  : ${order.customerName || "GUEST"}`,
    `PHONE : +91 ${order.customerPhone ? order.customerPhone.replace(/\D/g, "") : ""}`,
    order.customerEmail ? `EMAIL : ${order.customerEmail}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const subtotal = order.subtotal ?? 0;
  const shipping = order.shipping ?? 0;
  const total = order.total ?? subtotal + shipping;
  const shippingText = shipping === 0 ? "Free Shipping" : `₹${shipping} INR`;

  const divider = "--------------------------------";

  const parts = [
    "👉 New Order Received",
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
    "📋 CUSTOMER DETAILS:",
    "",
    customerDetails,
    "",
    divider,
    "",
    "📋 DELIVERY ADDRESS:",
    "",
    addressLines,
  ];

  return parts.join("\n");
}

/** Build exact formatted WhatsApp message template for admin messaging a customer. */
export function buildAdminCustomerWhatsAppMessage(order: Partial<Order>): string {
  const baseMessage = buildFormattedWhatsAppOrderMessage(order);
  const divider = "--------------------------------";
  return `${baseMessage}\n\n${divider}\n\nPlease confirm the above order details.`;
}

/** Build WhatsApp message containing payment link to share with customer. */
export function buildAdminCustomerPaymentLinkMessage(order: Partial<Order>): string {
  const rawId = order.id ?? "";
  const shortId = rawId ? rawId.replace(/^ord_/, "").toUpperCase().slice(0, 8) : "N/A";
  const total = order.total ?? 0;
  const siteUrl = typeof window !== "undefined" ? window.location.origin : config.siteUrl;
  const paymentLink = `${siteUrl}/pay/${rawId}`;

  return [
    `Hello! Your order #${shortId} is confirmed with ${config.businessName}.`,
    "",
    `Total Amount: ₹${total}`,
    `Please complete your online payment securely using this link:`,
    paymentLink,
    "",
    "Thank you!",
  ].join("\n");
}

/** Get official tracking page URL for supported courier companies. */
export function getTrackingLink(company: string, trackingId: string): string {
  if (!trackingId) return "";
  const cleanCompany = company.trim().toLowerCase();

  // Check if it's a custom company with a custom tracking URL format
  if (company.includes("|")) {
    const [_, route] = company.split("|");
    if (route) {
      const finalRoute = route.trim();
      // Replace placeholder if it exists
      if (finalRoute.includes("TRACKING_ID")) {
        return finalRoute.replace("TRACKING_ID", trackingId);
      }
      if (finalRoute.includes("[TRACKING_ID]")) {
        return finalRoute.replace("[TRACKING_ID]", trackingId);
      }
      // Otherwise append tracking ID
      if (finalRoute.endsWith("=") || finalRoute.endsWith("/")) {
        return finalRoute + trackingId;
      }
      return finalRoute + (finalRoute.includes("?") ? "&" : "?") + "id=" + trackingId;
    }
  }

  if (cleanCompany.includes("dtdc")) return "https://www.dtdc.com";
  if (cleanCompany.includes("world first")) return "https://worldfirst.in";
  if (cleanCompany.includes("apsrtc")) return "https://cargo.apsrtconline.in";
  if (cleanCompany.includes("tsrtc")) return "https://app.tgsrtclogistics.co.in";
  return "";
}

/** Build WhatsApp message containing shipment details to share with customer. */
export function buildShipmentWhatsAppMessage(
  order: Partial<Order>,
  deliveryCompany?: string,
  deliveryTrackingId?: string,
): string {
  const rawId = order.id ?? "";
  const shortId = rawId ? rawId.replace(/^ord_/, "").toUpperCase().slice(0, 8) : "N/A";

  const companyLine = deliveryCompany ? `🚚 *Courier Partner* : ${deliveryCompany}` : "";
  const trackingLine = deliveryTrackingId ? `📦 *Tracking ID*      : ${deliveryTrackingId}` : "";
  const trackingLink = getTrackingLink(deliveryCompany || "", deliveryTrackingId || "");
  const trackingLinkLine = trackingLink ? `🔗 *Tracking Link*    : ${trackingLink}` : "";
  const detailsBlock = [companyLine, trackingLine, trackingLinkLine].filter(Boolean).join("\n");

  return [
    `*🎉 Great news! Your order has been shipped!*`,
    "",
    `Hello ${order.customerName || "Customer"},`,
    `We have shipped your order *#${shortId}* from *${config.businessName}*! Here are your shipping details:`,
    "",
    "--------------------------------",
    detailsBlock,
    "--------------------------------",
    "",
    `🗓️ *Estimated Delivery:* 3-4 business days.`,
    `📞 If you do not receive it within this time, please contact us at *${config.contact.phone}*.`,
    "",
    `⚠️ *CRITICAL: BOX OPENING INSTRUCTIONS*`,
    "Please record a *continuous video of opening the box* without any cuts, edits, or pauses. This video is *compulsory* to claim a refund or replacement in case of damages or missing items.",
    "",
    `Thank you for ordering traditional pure ghee sweets from us! We hope you love them! ✨`,
  ].filter((l) => l !== undefined).join("\n");
}

/** Build WhatsApp message containing delivery follow-up and review incentive to share with customer. */
export function buildDeliveryWhatsAppMessage(order: Partial<Order>): string {
  const rawId = order.id ?? "";
  const shortId = rawId ? rawId.replace(/^ord_/, "").toUpperCase().slice(0, 8) : "N/A";

  return [
    `*🎉 Sweets Delivered! Hope you love them!* 🎁`,
    "",
    `Hello ${order.customerName || "Customer"},`,
    `Your order *#${shortId}* from *${config.businessName}* has been successfully delivered! We hope you enjoy our traditional, pure ghee sweets and crunchy namkeens.`,
    "",
    `If you loved our products, we would be thrilled if you shared the joy!`,
    `*Post a story on Instagram* tagging us *@bhaktanjaneyasweets.in* and adding our website link: ${config.siteUrl}`,
    "",
    `As a token of our appreciation, we'll send you:`,
    `🎁 A *complimentary sweet* on your next order`,
    `*OR*`,
    `🎟️ A *5% discount coupon* for your next online purchase!`,
    "",
    `Thank you so much for choosing us. We look forward to serving you again soon! ✨`,
  ].join("\n");
}
