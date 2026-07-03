// Server-only: sends messages via Meta WhatsApp Cloud API.
// Requires WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID (from the
// Meta developer console "API Setup" page for the test number).

const GRAPH_URL = "https://graph.facebook.com/v21.0";

function toWaNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  // ponytail: assume India for bare 10-digit numbers; store E.164 if going international
  return digits.length === 10 ? `91${digits}` : digits;
}

export const whatsappConfigured = Boolean(
  process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
);

/**
 * Send an OTP over WhatsApp. Uses an authentication template if
 * WHATSAPP_OTP_TEMPLATE is set; otherwise a plain text message (works for
 * testing only if the recipient has messaged the test number in the last 24h).
 * Returns an error string on failure, null on success.
 */
export async function sendWhatsAppOtp(phone: string, code: string): Promise<string | null> {
  if (!whatsappConfigured) return "WhatsApp API not configured";

  const to = toWaNumber(phone);
  const template = process.env.WHATSAPP_OTP_TEMPLATE;

  const payload = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_OTP_TEMPLATE_LANG || "en" },
          components: [
            { type: "body", parameters: [{ type: "text", text: code }] },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: `Your Bhaktanjaneya Sweets login code is ${code}. It expires in 5 minutes.` },
      };

  const res = await fetch(
    `${GRAPH_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return err?.error?.message || `WhatsApp API error (${res.status})`;
  }
  return null;
}
