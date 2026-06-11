import type { AdminUser } from "@/lib/types";
import { apiPost } from "./client";

export interface AdminSession {
  token: string;
  user: AdminUser;
}

export async function adminLogin(
  email: string,
  password: string,
): Promise<AdminSession> {
  return apiPost<AdminSession>("/admin/login", { email, password });
}
