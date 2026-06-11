import type { Session } from "@/lib/types";
import { apiPost } from "./client";

export async function requestOtp(
  phone: string,
): Promise<{ ok: boolean; devCode?: string }> {
  const result = await apiPost<{ ok: boolean; devCode?: string }>("/auth/request-otp", { phone });
  return { ok: true, devCode: result.devCode };
}

export async function verifyOtp(phone: string, code: string): Promise<Session> {
  return apiPost<Session>("/auth/verify-otp", { phone, code });
}
