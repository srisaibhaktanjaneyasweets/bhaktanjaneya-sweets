import type { Post } from "@/lib/types";
import { postFromRow } from "@/lib/supabase/mappers";
import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { MOCK_POSTS } from "@/lib/mockData";

function seedPosts(): Post[] {
  return MOCK_POSTS;
}

export async function getPosts(): Promise<Post[]> {
  if (!isConfigured) {
    return seedPosts();
  }
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("active", true)
    .order("date", { ascending: false });

  if (error) {
    console.warn("posts table unavailable, using seed posts:", error.message);
    return seedPosts();
  }
  const posts = (data ?? []).map((row) => postFromRow(row));
  return posts.length ? posts : seedPosts();
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!isConfigured) {
    return seedPosts().find((p) => p.slug === slug) ?? null;
  }
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("posts table unavailable, using seed posts:", error.message);
    return seedPosts().find((p) => p.slug === slug) ?? null;
  }
  return data ? postFromRow(data) : (seedPosts().find((p) => p.slug === slug) ?? null);
}
