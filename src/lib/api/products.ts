import type { Product } from "@/lib/types";
import { productFromRow } from "@/lib/supabase/mappers";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { MOCK_PRODUCTS } from "@/lib/mockData";

function throwIfSupabaseError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getProducts(): Promise<Product[]> {
  if (!isConfigured) {
    return MOCK_PRODUCTS;
  }
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });
  throwIfSupabaseError(error);
  return (data ?? []).map((row) => productFromRow(row));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isConfigured) {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  throwIfSupabaseError(error);
  return data ? productFromRow(data) : null;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (!isConfigured) {
    return MOCK_PRODUCTS.filter((p) => p.category === category);
  }
  // Match either the legacy single category or the multi-category array.
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("active", true)
    .or(`category.eq.${category},categories.cs.{${category}}`)
    .order("name", { ascending: true });

  // The `categories` column is added by migration 010 and may not exist yet —
  // fall back to the legacy single-category query so collections keep working.
  if (error) {
    const fallback = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("active", true)
      .eq("category", category)
      .order("name", { ascending: true });
    throwIfSupabaseError(fallback.error);
    return (fallback.data ?? []).map((row) => productFromRow(row));
  }

  return (data ?? []).map((row) => productFromRow(row));
}

export async function getProductsByTag(tag: string): Promise<Product[]> {
  if (!isConfigured) {
    return MOCK_PRODUCTS.filter((p) => p.tags.includes(tag));
  }
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("active", true)
    .contains("tags", [tag])
    .order("name", { ascending: true });
  throwIfSupabaseError(error);
  return (data ?? []).map((row) => productFromRow(row));
}
