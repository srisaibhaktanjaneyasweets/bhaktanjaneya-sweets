import type { Customer, Session } from "@/lib/types";
import { apiPatch, apiPost } from "./client";

export type AuthMode = "login" | "signup";

export interface SignupDetails {
  name: string;
  email: string;
}

export async function requestOtp(
  phone: string,
  mode: AuthMode = "login",
  resend = false,
): Promise<{ ok: boolean; devCode?: string }> {
  const result = await apiPost<{ ok: boolean; devCode?: string }>("/auth/request-otp", { phone, mode, resend });
  return { ok: true, devCode: result.devCode };
}

export async function verifyOtp(
  phone: string,
  code: string,
  mode: AuthMode = "login",
  details?: SignupDetails,
): Promise<Session> {
  return apiPost<Session>("/auth/verify-otp", { phone, code, mode, details });
}

export async function updateCustomerProfile(
  patch: Partial<Customer>,
): Promise<Customer> {
  return apiPatch<Customer>("/auth/profile", patch);
}
