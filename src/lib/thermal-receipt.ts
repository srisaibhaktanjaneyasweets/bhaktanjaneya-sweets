import type { Order } from "./types";
import { config } from "./config";
import { formatINR } from "./utils";

/**
 * Generate thermal receipt HTML specifically formatted for 3-inch (80mm roll / 72mm printable area) thermal receipt printers.
 */
export function generateThermalReceiptHtml(order: Order): string {
  const shortId = order.id.replace(/^ord_/, "").toUpperCase().slice(0, 8);
  const dateStr = new Date(order.createdAt).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const addr = order.shippingAddress;
  const addressStr = addr
    ? [
        addr.line1,
        addr.line2,
        `${addr.city}, ${addr.state} ${addr.pincode}`,
      ]
        .filter(Boolean)
        .join("<br/>")
    : "No address provided";

  const itemsRows = order.items
    .map(
      (it, idx) => `
      <tr>
        <td style="padding: 5px 0; text-align: left; vertical-align: top; word-break: break-word; font-size: 18px;">
          <strong style="font-size: 18px; font-weight: 900;">${idx + 1}. ${it.name}</strong><br/>
          <span style="font-size: 15px; color: #000; font-weight: 600;">${it.variantLabel}</span>
        </td>
        <td style="padding: 5px 0; text-align: center; vertical-align: top; white-space: nowrap; font-size: 18px; font-weight: 900;">x${it.quantity}</td>
        <td style="padding: 5px 0; text-align: right; vertical-align: top; white-space: nowrap; font-size: 18px; font-weight: 900;">${formatINR(it.price * it.quantity)}</td>
      </tr>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Thermal Receipt #${shortId}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    html, body {
      width: 74mm;
      max-width: 74mm;
      margin: 0 auto;
      padding: 6px 2px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 17px;
      line-height: 1.4;
      font-weight: 700;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
    }
    .center { text-align: center; }
    .bold { font-weight: 900; }
    .divider { border-top: 1.5px dashed #000; margin: 8px 0; }
    .double-divider { border-top: 2.5px solid #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 17px; font-family: 'Courier New', Courier, monospace; }
    .flex-between { display: flex; justify-content: space-between; }
    .title { font-size: 24px; font-weight: 900; letter-spacing: 0.02em; }
    .subtitle { font-size: 15px; font-weight: 700; }
    @media print {
      html, body {
        width: 80mm !important;
        max-width: 80mm !important;
        padding: 4mm 2mm !important;
        margin: 0 !important;
        font-size: 17px !important;
      }
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="title">${config.businessName.toUpperCase()}</div>
    <div class="subtitle">Authentic Sweets &amp; Savouries</div>
    <div class="subtitle">Ph: ${config.contact.phone}</div>
  </div>

  <div class="double-divider"></div>

  <div>
    <div class="flex-between"><span>ORDER #:</span><span class="bold" style="font-size: 19px;">#${shortId}</span></div>
    <div class="flex-between"><span>DATE:</span><span>${dateStr}</span></div>
    <div class="flex-between"><span>PAYMENT:</span><span class="bold">${(order.paymentStatus || "").toUpperCase()} (${(order.paymentMethod || "").toUpperCase()})</span></div>
  </div>

  <div class="divider"></div>

  <div>
    <div class="bold" style="font-size: 18px;">CUSTOMER:</div>
    <div style="font-size: 18px; font-weight: 900;">${order.customerName || "Customer"}</div>
    <div style="font-size: 17px;">Ph: ${order.customerPhone}</div>
    ${order.customerEmail ? `<div style="font-size: 15px;">${order.customerEmail}</div>` : ""}
  </div>

  <div class="divider"></div>

  <table>
    <thead>
      <tr style="border-bottom: 2px dashed #000; font-size: 17px;">
        <th style="text-align: left; padding-bottom: 6px; font-weight: 900;">ITEM</th>
        <th style="text-align: center; padding-bottom: 6px; width: 45px; font-weight: 900;">QTY</th>
        <th style="text-align: right; padding-bottom: 6px; width: 85px; font-weight: 900;">AMT</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="divider"></div>

  <div>
    <div class="flex-between"><span>Subtotal:</span><span>${formatINR(order.subtotal)}</span></div>
    ${order.discount ? `<div class="flex-between"><span>Discount:</span><span>-${formatINR(order.discount)}</span></div>` : ""}
    <div class="flex-between"><span>Delivery Fee:</span><span>${order.shipping ? formatINR(order.shipping) : "FREE"}</span></div>
    <div class="divider"></div>
    <div class="flex-between bold" style="font-size: 22px;"><span>TOTAL AMOUNT:</span><span>${formatINR(order.total)}</span></div>
  </div>

  <div class="divider"></div>

  <div>
    <div class="bold" style="font-size: 18px;">DELIVERY ADDRESS:</div>
    <div style="font-size: 15px; font-weight: 700; line-height: 1.4;">${addressStr}</div>
    ${order.notes ? `<div style="margin-top: 6px; font-size: 15px;"><strong>NOTE:</strong> ${order.notes}</div>` : ""}
  </div>

  <div class="double-divider"></div>

  <div class="center subtitle" style="margin-top: 10px; font-size: 15px; font-weight: 900;">
    THANK YOU FOR SHOPPING!<br/>
    www.bhaktanjaneyasweets.in
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;
}

/**
 * Generate full A4 Tax Invoice / Order Receipt HTML for high-resolution printing & PDF saving.
 */
export function generateFullInvoiceHtml(order: Order): string {
  const shortId = order.id.replace(/^ord_/, "").toUpperCase().slice(0, 8);
  const dateStr = new Date(order.createdAt).toLocaleString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const addr = order.shippingAddress;
  const addressStr = addr
    ? [addr.line1, addr.line2, `${addr.city}, ${addr.state} - ${addr.pincode}`, "India"].filter(Boolean).join("<br/>")
    : "No shipping address specified";

  const itemsTable = order.items
    .map(
      (it, idx) => `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 12px; text-align: center; color: #4B5563;">${idx + 1}</td>
        <td style="padding: 12px; font-weight: 600; color: #111827;">
          ${it.name}
          <div style="font-size: 12px; font-weight: 400; color: #6B7280;">Size / Variant: ${it.variantLabel}</div>
        </td>
        <td style="padding: 12px; text-align: center; color: #111827;">${formatINR(it.price)}</td>
        <td style="padding: 12px; text-align: center; font-weight: 600; color: #111827;">${it.quantity}</td>
        <td style="padding: 12px; text-align: right; font-weight: 700; color: #111827;">${formatINR(it.price * it.quantity)}</td>
      </tr>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice #${shortId} - ${config.businessName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      color: #1F2937;
      background: #fff;
      margin: 0;
      padding: 24px;
    }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; background: #DEF7EC; color: #03543F; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.data-table th { background: #6B21A8; color: #fff; text-align: left; padding: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
    table.data-table th:first-child { border-top-left-radius: 8px; }
    table.data-table th:last-child { border-top-right-radius: 8px; }
    .totals-table { width: 280px; margin-left: auto; border-collapse: collapse; font-size: 14px; }
    .totals-table td { padding: 6px 0; }
    .footer-note { text-align: center; margin-top: 40px; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 20px; }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="vertical-align: top;">
        <h1 style="margin: 0; font-size: 24px; color: #581C87; font-family: serif;">${config.businessName}</h1>
        <div style="font-size: 13px; color: #4B5563; margin-top: 4px;">
          Authentic Traditional Sweets &amp; Savouries<br/>
          Ph: ${config.contact.phone} | Email: ${config.contact.email}
        </div>
      </td>
      <td style="text-align: right; vertical-align: top;">
        <h2 style="margin: 0; font-size: 22px; color: #111827;">OFFICIAL RECEIPT</h2>
        <div style="font-size: 14px; font-weight: 700; color: #581C87; margin-top: 4px;">Order #${shortId}</div>
        <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">Date: ${dateStr}</div>
        <div style="margin-top: 8px;"><span class="badge">${(order.paymentStatus || "PENDING").toUpperCase()}</span></div>
      </td>
    </tr>
  </table>

  <div class="card">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 12px;">
          <strong style="color: #581C87; font-size: 12px; text-transform: uppercase;">Customer Details</strong>
          <div style="font-size: 15px; font-weight: 700; margin-top: 4px;">${order.customerName || "Customer"}</div>
          <div style="font-size: 13px; color: #4B5563; margin-top: 2px;">
            Phone: ${order.customerPhone}<br/>
            Email: ${order.customerEmail || "N/A"}
          </div>
        </td>
        <td style="width: 50%; vertical-align: top; border-left: 1px solid #E5E7EB; padding-left: 16px;">
          <strong style="color: #581C87; font-size: 12px; text-transform: uppercase;">Delivery Address</strong>
          <div style="font-size: 13px; color: #374151; margin-top: 4px; line-height: 1.4;">${addressStr}</div>
          ${order.notes ? `<div style="font-size: 12px; color: #6B7280; margin-top: 6px;"><strong>Note:</strong> ${order.notes}</div>` : ""}
        </td>
      </tr>
    </table>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">#</th>
        <th>Item &amp; Description</th>
        <th style="text-align: center; width: 100px;">Unit Price</th>
        <th style="text-align: center; width: 60px;">Qty</th>
        <th style="text-align: right; width: 110px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsTable}
    </tbody>
  </table>

  <table class="totals-table">
    <tr>
      <td style="color: #4B5563;">Subtotal:</td>
      <td style="text-align: right; font-weight: 600;">${formatINR(order.subtotal)}</td>
    </tr>
    ${order.discount ? `<tr><td style="color: #059669;">Discount:</td><td style="text-align: right; font-weight: 600; color: #059669;">-${formatINR(order.discount)}</td></tr>` : ""}
    <tr>
      <td style="color: #4B5563;">Shipping &amp; Handling:</td>
      <td style="text-align: right; font-weight: 600;">${order.shipping ? formatINR(order.shipping) : "FREE"}</td>
    </tr>
    <tr style="border-top: 2px solid #111827; border-bottom: 2px solid #111827;">
      <td style="font-size: 16px; font-weight: 700; padding: 8px 0;">Total Amount:</td>
      <td style="font-size: 16px; font-weight: 800; text-align: right; color: #581C87; padding: 8px 0;">${formatINR(order.total)}</td>
    </tr>
  </table>

  <div class="footer-note">
    Thank you for purchasing from ${config.businessName}!<br/>
    For assistance or bulk orders, visit www.bhaktanjaneyasweets.in or call ${config.contact.phone}.
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;
}

/** Trigger direct print / PDF download popup for 3-inch thermal slip. */
export function printThermalReceipt(order: Order) {
  const html = generateThermalReceiptHtml(order);
  const printWindow = window.open("", "_blank", "width=360,height=600");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/** Trigger direct print / PDF download popup for full A4 invoice. */
export function printFullInvoice(order: Order) {
  const html = generateFullInvoiceHtml(order);
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
