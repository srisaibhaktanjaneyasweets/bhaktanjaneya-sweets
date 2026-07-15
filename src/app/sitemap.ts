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
    "",
    "/shop",
    "/about",
    "/contact",
    "/blog",
    "/faq",
    "/login",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const [products, categories, posts] = await Promise.all([
    getProducts(),
    getCategories(),
    getPosts(),
  ]);

  const productRoutes = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${base}/collections/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const blogRoutes = posts.map((b) => ({
    url: `${base}/blog/${b.slug}`,
    lastModified: b.date ? new Date(b.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
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
