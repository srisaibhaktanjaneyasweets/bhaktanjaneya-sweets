import { config } from "@/lib/config";

// Fetch wrapper for browser calls to the Next.js API routes (/api/*).

function readStoredToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const keys = ["bas_admin_session", "bas_session"];
  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed.token) return parsed.token;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = readStoredToken();
  const baseUrl = config.apiBaseUrl || config.siteUrl || "http://localhost:3000";
  const resolvedPath = config.apiBaseUrl
    ? path
    : path.startsWith("/api/")
      ? path
      : path.startsWith("/api")
        ? path
        : `/api${path.startsWith("/") ? path : `/${path}`}`;
  const url = path.startsWith("http") ? path : new URL(resolvedPath, baseUrl).toString();
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}`);
  }
  return (res.status === 204 ? (undefined as T) : ((await res.json()) as T));
}

export const apiGet = <T>(path: string) => req<T>(path);
export const apiPost = <T>(path: string, body?: unknown) =>
  req<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });
export const apiPut = <T>(path: string, body?: unknown) =>
  req<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) });
export const apiPatch = <T>(path: string, body?: unknown) =>
  req<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) });
export const apiDelete = <T>(path: string) =>
  req<T>(path, { method: "DELETE" });
