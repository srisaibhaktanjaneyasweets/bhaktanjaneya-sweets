import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { issueToken } from "@/lib/server/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const email = (body?.email || "").toLowerCase();
  const password = body?.password;
  if (!email || !password) return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

  // Local mock testing mode fallback when Supabase keys are not set up
  if (!isConfigured) {
    const isMockPassword = password === "admin123" || password === "admin";
    if (isMockPassword) {
      const token = issueToken({
        sub: "mock-admin-id",
        role: "admin",
        email: email,
        name: "Bhaktanjaneya Admin",
      });
      return NextResponse.json({
        token,
        user: {
          id: "mock-admin-id",
          email: email,
          name: "Bhaktanjaneya Admin",
          role: "admin",
        },
      });
    }
    return NextResponse.json(
      { error: "Invalid password for mock mode. Please use admin123." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin.from("admins").select("*").eq("email", email).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const admin = data;
  if (!admin) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const ok = bcrypt.compareSync(password, admin.password_hash || "");
  if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const token = issueToken({ sub: admin.id, role: "admin", email: admin.email, name: admin.name });
  return NextResponse.json({ token, user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
}
