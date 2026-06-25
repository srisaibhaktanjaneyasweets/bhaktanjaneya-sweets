import { NextResponse } from "next/server";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { productFromRow } from "@/lib/supabase/mappers";
import type { Product } from "@/lib/types";
import { MOCK_PRODUCTS } from "@/lib/mockData";

type ProductRow = Record<string, unknown>;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const tag = url.searchParams.get("tag");
  const q = url.searchParams.get("q")?.trim();

  if (!isConfigured) {
    let list = MOCK_PRODUCTS.filter(p => p.active);
    if (category) list = list.filter(p => p.category === category);
    if (tag) list = list.filter(p => p.tags.includes(tag));
    if (q) {
      const qLower = q.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(qLower) || p.description.toLowerCase().includes(qLower));
    }
    return NextResponse.json(list);
  }

  // Base: storefront only needs active products.
  let query = supabaseAdmin.from("products").select("*").eq("active", true);
  if (category) query = query.eq("category", category);
  if (tag) query = query.contains("tags", [tag]);

  // Fuzzy ranked search (Postgres pg_trgm + trigram similarity)
  // Returns ranked results via DB function.
  if (q) {
    const { data, error } = await supabaseAdmin.rpc("search_products_fuzzy", {
      query_text: q,
      limit: 24,
      category_filter: category,
      tag_filter: tag,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
      ((data ?? []) as ProductRow[]).map((row) => productFromRow(row) as unknown as Product)
    );
  }

  const { data, error } = await query.order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(((data ?? []) as ProductRow[]).map((row) => productFromRow(row)));
}
