import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { productFromRow } from "@/lib/supabase/mappers";
import { MOCK_PRODUCTS } from "@/lib/mockData";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const p = await params;
  if (!isConfigured) {
    const product = MOCK_PRODUCTS.find((prod) => prod.slug === p.slug && prod.active) ?? null;
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  }
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("slug", p.slug)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(productFromRow(data));
}
