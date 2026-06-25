import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { categoryFromRow } from "@/lib/supabase/mappers";
import { MOCK_CATEGORIES } from "@/lib/mockData";

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json(MOCK_CATEGORIES);
  }
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((row) => categoryFromRow(row)));
}
