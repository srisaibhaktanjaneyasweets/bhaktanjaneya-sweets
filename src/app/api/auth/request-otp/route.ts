import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

function genCode() {
  // Cryptographically secure 6-digit code (Math.random is predictable and
  // must not be used for security tokens like OTPs).
  return crypto.randomInt(100000, 1000000).toString();
}

export async function POST(req: Request) {
  const body = await req.json();
  const phone = body?.phone;
  const mode = body?.mode === "signup" ? "signup" : "login";
  if (!phone) return NextResponse.json({ error: "Missing phone" }, { status: 400 });

  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("phone")
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();
  if (customerError) return NextResponse.json({ error: customerError.message }, { status: 500 });
  if (mode === "login" && !customer) {
    return NextResponse.json({ error: "No account found. Please sign up first." }, { status: 404 });
  }
  if (mode === "signup" && customer) {
    return NextResponse.json({ error: "An account already exists. Please log in instead." }, { status: 409 });
  }

  // Basic abuse throttle: cap how many codes a single phone can request in a
  // short window (prevents SMS-bombing / brute-force seeding).
  const windowStart = new Date(Date.now() - 60 * 1000).toISOString();
  const { count: recentCount } = await supabaseAdmin
    .from("otps")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", windowStart);
  if ((recentCount ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Too many code requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const code = genCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin.from("otps").insert({ phone, code, expires_at: expiresAt });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Never return the live code from a deployed build. `next dev` is the only
  // place NODE_ENV is "development" (preview/staging/prod all build as
  // "production"), so local OTP login keeps working without leaking codes
  // anywhere it's deployed. OTP_DEBUG can force it on if ever needed.
  const debug =
    process.env.OTP_DEBUG === "true" || process.env.NODE_ENV === "development";
  return NextResponse.json(debug ? { ok: true, devCode: code } : { ok: true });
}
