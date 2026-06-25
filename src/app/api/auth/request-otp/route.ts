import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";

function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  const body = await req.json();
  const phone = body?.phone;
  const mode = body?.mode === "signup" ? "signup" : "login";
  if (!phone) return NextResponse.json({ error: "Missing phone" }, { status: 400 });

  if (!isConfigured) {
    return NextResponse.json({ ok: true, devCode: "123456" });
  }

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

  const debug =
    process.env.OTP_DEBUG === "true" || process.env.NODE_ENV === "development";
  return NextResponse.json(debug ? { ok: true, devCode: code } : { ok: true });
}
