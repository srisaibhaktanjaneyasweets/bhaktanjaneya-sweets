import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

type Role = "admin" | "customer";

export interface TokenPayload {
  sub: string;
  role: Role;
  email?: string;
  name?: string;
  phone?: string;
  exp: number;
}

function getSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return "dev-auth-token-secret-change-me";
    }
    throw new Error("AUTH_TOKEN_SECRET is not configured");
  }
  return secret;
}

function base64UrlEncode(input: string) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function issueToken(payload: Omit<TokenPayload, "exp">, ttlSeconds = 60 * 60 * 24 * 7) {
  const body: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const raw = base64UrlEncode(JSON.stringify(body));
  const sig = crypto.createHmac("sha256", getSecret()).update(raw).digest("base64url");
  return `${raw}.${sig}`;
}

export function verifyToken(token: string): TokenPayload {
  const [raw, sig] = token.split(".");
  if (!raw || !sig) throw new Error("Invalid token");
  const expected = crypto.createHmac("sha256", getSecret()).update(raw).digest("base64url");
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error("Invalid token");
  }
  const payload = JSON.parse(base64UrlDecode(raw)) as TokenPayload;
  if (payload.exp * 1000 < Date.now()) throw new Error("Token expired");
  return payload;
}

export function getBearerToken(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

function getCookieToken(req: Request) {
  const header = req.headers.get("cookie") ?? "";
  const match = header.match(/(?:^|;\s*)bas_admin_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function normalizePhone(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const digits = value.replace(/\D/g, "").trim();
  return digits || undefined;
}

export async function requireRole(req: Request, role: Role) {
  const token = getBearerToken(req) || getCookieToken(req);
  if (!token) throw new Error("Missing bearer token");

  try {
    const payload = verifyToken(token);
    if (payload.role !== role) throw new Error("Forbidden");
    return payload;
  } catch {
    if (role === "admin") {
      throw new Error("Unauthorized");
    }
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Unauthorized");
  }

  const user = data.user;
  if (!user.email_confirmed_at && !user.confirmed_at) {
    throw new Error("Please verify your email before continuing.");
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    sub: user.id,
    role: "customer" as const,
    email: typeof user.email === "string" ? user.email : undefined,
    name: typeof metadata.name === "string" ? metadata.name : undefined,
    phone: normalizePhone(metadata.phone ?? user.phone),
  };
}
