import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const base = config.siteUrl.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private / admin / account areas out of search engine index
        disallow: ["/admin", "/account", "/cart", "/login", "/api/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "PerplexityBot",
          "ClaudeBot",
          "AnthropicBot",
        ],
        allow: "/",
        disallow: ["/admin", "/account", "/cart", "/login", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
