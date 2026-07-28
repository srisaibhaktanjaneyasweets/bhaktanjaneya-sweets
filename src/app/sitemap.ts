import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { getPosts } from "@/lib/api/posts";

import { policySlugs } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = config.siteUrl.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = [
    { path: "", changeFreq: "daily" as const, priority: 1.0 },
    { path: "/shop", changeFreq: "daily" as const, priority: 0.9 },
    { path: "/about", changeFreq: "weekly" as const, priority: 0.5 },
    { path: "/contact", changeFreq: "weekly" as const, priority: 0.5 },
    { path: "/blog", changeFreq: "daily" as const, priority: 0.7 },
    { path: "/faq", changeFreq: "weekly" as const, priority: 0.5 },
    { path: "/login", changeFreq: "monthly" as const, priority: 0.2 },
  ].map(({ path, changeFreq, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: changeFreq,
    priority,
  }));

  const [products, categories, posts] = await Promise.all([
    getProducts(),
    getCategories(),
    getPosts(),
  ]);

  const productRoutes = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${base}/collections/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const blogRoutes = posts.map((b) => ({
    url: `${base}/blog/${b.slug}`,
    lastModified: b.date ? new Date(b.date) : now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const policyRoutes = policySlugs.map((slug) => ({
    url: `${base}/policies/${slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  return [
    ...staticRoutes,
    ...productRoutes,
    ...categoryRoutes,
    ...blogRoutes,
    ...policyRoutes,
  ];
}
