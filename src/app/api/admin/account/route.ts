import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { isConfigured, supabaseAdmin } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8;
}

export async function POST(req: NextRequest) {
  let actor;
  try {
    actor = await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }

  if (!isConfigured) {
    return NextResponse.json({ error: "Admin account management requires Supabase." }, { status: 503 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const action = body.action;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (action === "create") {
    if (!EMAIL_PATTERN.test(email) || !validPassword(body.password)) {
      return NextResponse.json({ error: "Enter a valid email and a password with at least 8 characters." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("admins")
      .insert({ email, name: name || null, password_hash: await bcrypt.hash(body.password, 12), role: "admin" })
      .select("id, email, name, role")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ admin: data }, { status: 201 });
  }

  if (action !== "update") {
    return NextResponse.json({ error: "Invalid account action." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email) || typeof body.currentPassword !== "string") {
    return NextResponse.json({ error: "Enter your email and current password." }, { status: 400 });
  }
  if (body.newPassword !== undefined && body.newPassword !== "" && !validPassword(body.newPassword)) {
    return NextResponse.json({ error: "New passwords must contain at least 8 characters." }, { status: 400 });
  }

  const { data: current, error: currentError } = await supabaseAdmin
    .from("admins")
    .select("id, password_hash")
    .eq("id", actor.sub)
    .maybeSingle();
  if (currentError || !current || !bcrypt.compareSync(body.currentPassword, current.password_hash ?? "")) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
  }

  const update: Record<string, unknown> = { email, name: name || null };
  if (validPassword(body.newPassword)) update.password_hash = await bcrypt.hash(body.newPassword, 12);
  const { data, error } = await supabaseAdmin
    .from("admins")
    .update(update)
    .eq("id", actor.sub)
    .select("id, email, name, role")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ admin: data });
}
