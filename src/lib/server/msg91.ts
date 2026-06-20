/**
 * MSG91 OTP API (v5) — server-only. MSG91 generates, delivers, and verifies the
 * OTP on their side, so the code never lives in our database in production.
 *
 * Required env (server-only, never NEXT_PUBLIC):
 *   MSG91_AUTH_KEY     — account auth key
 *   MSG91_TEMPLATE_ID  — approved DLT OTP template id
 * Optional:
 *   MSG91_OTP_EXPIRY   — minutes a code stays valid (default 5)
 *
 * Docs: https://docs.msg91.com/otp
 */

const BASE = "https://control.msg91.com/api/v5";

export function isMsg91Configured(): boolean {
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
}

/** MSG91 needs the country code with no "+". Default to India (91). */
export function toMsg91Mobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

type Result = { ok: true } | { ok: false; error: string };

async function call(url: string, init: RequestInit): Promise<Result> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { authkey: process.env.MSG91_AUTH_KEY ?? "", ...init.headers },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      type?: string;
      message?: string;
    };
    if (res.ok && data?.type === "success") return { ok: true };
    return { ok: false, error: data?.message || "OTP request failed" };
  } catch {
    return { ok: false, error: "Could not reach the OTP service." };
  }
}

export function sendOtp(phone: string): Promise<Result> {
  const mobile = toMsg91Mobile(phone);
  const expiry = process.env.MSG91_OTP_EXPIRY || "5";
  const params = new URLSearchParams({
    template_id: process.env.MSG91_TEMPLATE_ID ?? "",
    mobile,
    otp_length: "6",
    otp_expiry: expiry,
  });
  return call(`${BASE}/otp?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

export function resendOtp(phone: string): Promise<Result> {
  const params = new URLSearchParams({
    mobile: toMsg91Mobile(phone),
    retrytype: "text",
  });
  return call(`${BASE}/otp/retry?${params.toString()}`, { method: "GET" });
}

export function verifyOtp(phone: string, otp: string): Promise<Result> {
  const params = new URLSearchParams({
    mobile: toMsg91Mobile(phone),
    otp,
  });
  return call(`${BASE}/otp/verify?${params.toString()}`, { method: "GET" });
}
