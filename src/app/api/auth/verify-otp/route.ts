import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { issueToken } from "@/lib/server/auth";
import { customerFromRow } from "@/lib/supabase/mappers";

export async function POST(req: Request) {
  const body = await req.json();
  const phone = body?.phone;
  const code = body?.code;
  const mode = body?.mode === "signup" ? "signup" : "login";
  const details = body?.details as { name?: string; email?: string } | undefined;
  if (!phone || !code) return NextResponse.json({ error: "Missing phone or code" }, { status: 400 });

  // Look at the most recent code issued for this phone (independent of the
  // guess) so we can enforce a per-code attempt limit — without it, the 6-digit
  // code could be brute-forced within its 5-minute window.
  const MAX_OTP_ATTEMPTS = 5;
  const { data, error } = await supabaseAdmin
    .from("otps")
    .select("*")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  if ((data.attempts ?? 0) >= MAX_OTP_ATTEMPTS) {
    await supabaseAdmin.from("otps").delete().eq("phone", phone);
    return NextResponse.json(
      { error: "Too many incorrect attempts. Please request a new code." },
      { status: 429 },
    );
  }

  if (String(data.code) !== String(code)) {
    // Wrong guess — count it against this code's budget. (Update is a no-op if
    // the `attempts` column hasn't been migrated yet; verification still works.)
    await supabaseAdmin
      .from("otps")
      .update({ attempts: (data.attempts ?? 0) + 1 })
      .eq("id", data.id);
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  // Correct code — single-use: invalidate every outstanding code for this phone
  // so it can't be replayed or brute-forced after a successful verification.
  await supabaseAdmin.from("otps").delete().eq("phone", phone);

  const { data: existingCustomer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();
  if (customerError) return NextResponse.json({ error: customerError.message }, { status: 500 });
  let customer = existingCustomer;

  if (mode === "login" && !customer) {
    return NextResponse.json({ error: "No account found. Please sign up first." }, { status: 404 });
  }
  if (mode === "signup" && customer) {
    return NextResponse.json({ error: "An account already exists. Please log in instead." }, { status: 409 });
  }

  if (mode === "signup") {
    const name = details?.name?.trim();
    const email = details?.email?.trim();
    if (!name) return NextResponse.json({ error: "Name is required to sign up" }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required to sign up" }, { status: 400 });
    }
    const payload = {
      phone,
      name,
      email,
      created_at: customer?.created_at ?? new Date().toISOString(),
    };
    const { data: upserted, error: upsertError } = await supabaseAdmin
      .from("customers")
      .upsert(payload, { onConflict: "phone" })
      .select("*")
      .limit(1)
      .maybeSingle();
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
    customer = upserted;
  }

  if (!customer) {
    const { data: inserted } = await supabaseAdmin.from("customers").insert({ phone }).select("*").limit(1).maybeSingle();
    customer = inserted;
  }

  const token = issueToken({ sub: phone, role: "customer", phone, name: customer?.name });

  return NextResponse.json({ token, customer: customer ? customerFromRow(customer) : undefined });
}
