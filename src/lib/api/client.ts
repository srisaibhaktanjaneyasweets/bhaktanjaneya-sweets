"use client";

import { supabasePublic } from "@/lib/supabase/client";

/**
 * Production-ready API client with structured error handling.
 * Converts failed responses into a standard ApiError that can be caught by UI components.
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Same-origin Next.js API routes live under /api. Empty env must still resolve to /api. */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, "");

let cachedSupabaseToken: string | null | undefined;
let supabaseTokenCacheInitialized = false;

function initSupabaseTokenCache() {
  if (supabaseTokenCacheInitialized || typeof window === "undefined") return;
  supabaseTokenCacheInitialized = true;

  supabasePublic.auth.getSession().then(({ data }) => {
    cachedSupabaseToken = data.session?.access_token ?? null;
  }).catch(() => {
    cachedSupabaseToken = null;
  });

  supabasePublic.auth.onAuthStateChange((_event, session) => {
    cachedSupabaseToken = session?.access_token ?? null;
  });
}

async function authTokenFor(path: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const readToken = (key: string) => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const { token } = JSON.parse(raw) as { token?: string };
      return token ?? null;
    } catch {
      return null;
    }
  };

  if (path.startsWith("/admin/")) {
    return readToken("bas_admin_session") ?? readToken("bas_session");
  }

  initSupabaseTokenCache();

  if (cachedSupabaseToken !== undefined) {
    return cachedSupabaseToken;
  }

  try {
    const { data } = await supabasePublic.auth.getSession();
    cachedSupabaseToken = data.session?.access_token ?? null;
    if (cachedSupabaseToken) return cachedSupabaseToken;
  } catch {
    cachedSupabaseToken = null;
    // Fall back to the legacy customer session if Supabase is unavailable.
  }
  return readToken("bas_session");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = await authTokenFor(path);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: { error?: string; message?: string } = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    const message =
      errorData.error ??
      errorData.message ??
      response.statusText ??
      "An unexpected error occurred";
    throw new ApiError(message, response.status, errorData);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export const apiGet = <T>(path: string) => request<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPut = <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) => request<T>(path, { method: "DELETE" });
