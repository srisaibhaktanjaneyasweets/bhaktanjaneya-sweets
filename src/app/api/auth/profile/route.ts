import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { customerFromRow, customerToRow } from "@/lib/supabase/mappers";
import type { Customer, ShippingAddress } from "@/lib/types";

function isValidAddress(address: unknown): address is ShippingAddress {
  if (!address || typeof address !== "object") return false;
  const a = address as ShippingAddress;
  return (
    typeof a.line1 === "string" &&
    a.line1.trim().length > 0 &&
    typeof a.city === "string" &&
    a.city.trim().length > 0 &&
    typeof a.state === "string" &&
    a.state.trim().length > 0 &&
    typeof a.pincode === "string" &&
    /^\d{6}$/.test(a.pincode.trim())
  );
}

function cleanAddress(address: ShippingAddress): ShippingAddress {
  return {
    line1: address.line1.trim(),
    line2: address.line2?.trim() || undefined,
    district: address.district?.trim() || undefined,
    city: address.city.trim(),
    state: address.state.trim(),
    pincode: address.pincode.trim(),
  };
}

export async function GET(req: Request) {
  let payload;
  try {
    payload = await requireRole(req, "customer");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("phone", payload.phone ?? payload.sub)
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  return NextResponse.json(customerFromRow(data as Record<string, unknown>));
}

export async function PATCH(req: Request) {
  let payload;
  try {
    payload = await requireRole(req, "customer");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<Customer>;
  const patch: Partial<Customer> = {};

  if (body.name !== undefined) patch.name = body.name.trim() || undefined;
  if (body.email !== undefined) {
    const email = body.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    patch.email = email || undefined;
  }
  if (body.savedAddress !== undefined) {
    if (!isValidAddress(body.savedAddress)) {
      return NextResponse.json({ error: "Please enter a complete delivery address" }, { status: 400 });
    }
    patch.savedAddress = cleanAddress(body.savedAddress);
  }

  const { data, error } = await supabaseAdmin
    .from("customers")
    .update(customerToRow(patch))
    .eq("phone", payload.phone ?? payload.sub)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(customerFromRow(data as Record<string, unknown>));
}
