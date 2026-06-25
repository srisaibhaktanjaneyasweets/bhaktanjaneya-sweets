import type { Category } from "@/lib/types";
import { categoryFromRow } from "@/lib/supabase/mappers";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { MOCK_CATEGORIES } from "@/lib/mockData";

function throwIfSupabaseError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getCategories(): Promise<Category[]> {
  if (!isConfigured) {
    return MOCK_CATEGORIES;
  }
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  throwIfSupabaseError(error);
  return (data ?? []).map((row) => categoryFromRow(row));
}

export async function getCategory(slug: string): Promise<Category | null> {
  if (!isConfigured) {
    return MOCK_CATEGORIES.find((c) => c.slug === slug) ?? null;
  }
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  throwIfSupabaseError(error);
  return data ? categoryFromRow(data) : null;
}
