import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { issueToken } from "@/lib/server/auth";
import { customerFromRow } from "@/lib/supabase/mappers";

export async function POST(req: Request) {
  const body = await req.json();
  const phone = body?.phone;
  const code = body?.code;
  const mode = body?.mode === "signup" ? "signup" : "login";
  const details = body?.details as { name?: string; email?: string } | undefined;
  if (!phone || !code) return NextResponse.json({ error: "Missing phone or code" }, { status: 400 });

  if (!isConfigured) {
    if (code !== "123456") {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }
    const customer = {
      id: "cus_" + phone,
      phone,
      name: details?.name || "Demo Customer",
      email: details?.email || "customer@example.com",
      created_at: new Date().toISOString(),
    };
    const token = issueToken({ sub: phone, role: "customer", phone, name: customer.name });
    return NextResponse.json({ token, customer });
  }

  const { data, error } = await supabaseAdmin
    .from("otps")
    .select("*")
    .eq("phone", phone)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

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
