import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { DEFAULT_SERVICEABLE_AREAS } from "@/lib/constants/serviceable-areas";

export async function GET(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  if (!isConfigured) return NextResponse.json(DEFAULT_SERVICEABLE_AREAS);

  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "serviceable_areas")
      .maybeSingle();

    if (data?.value && typeof data.value === "object" && Object.keys(data.value).length > 0) {
      return NextResponse.json(data.value);
    }
  } catch {
    // Fall back to default
  }

  return NextResponse.json(DEFAULT_SERVICEABLE_AREAS);
}

export async function PUT(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  let body: Record<string, string[]>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Payload must be a key-value map of states to cities" },
      { status: 400 },
    );
  }

  // Clean and normalize keys/values
  const cleaned: Record<string, string[]> = {};
  for (const [state, cities] of Object.entries(body)) {
    const trimmedState = state.trim();
    if (trimmedState && Array.isArray(cities)) {
      const uniqueCities = Array.from(
        new Set(cities.map((c) => String(c).trim()).filter(Boolean)),
      );
      cleaned[trimmedState] = uniqueCities;
    }
  }

  if (!isConfigured) return NextResponse.json(cleaned);

  try {
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        { key: "serviceable_areas", value: cleaned },
        { onConflict: "key" },
      );

    if (error) {
      // Try settings table fallback
      const { error: fallbackErr } = await supabaseAdmin
        .from("settings")
        .upsert(
          { key: "serviceable_areas", value: cleaned },
          { onConflict: "key" },
        );

      if (fallbackErr) {
        return NextResponse.json(
          { error: error.message || fallbackErr.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(cleaned);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save serviceable locations" },
      { status: 500 },
    );
  }
}
