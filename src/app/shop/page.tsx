import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ShopControls } from "@/components/shop/ShopControls";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { getTags } from "@/lib/api/tags";
import { sortProducts, prettifyTag } from "@/lib/product";

export const revalidate = 10;

export const metadata: Metadata = {
  title: "Shop All Sweets & Namkeen",
  description:
    "Browse the full range of Bhaktanjaneya Sweets — pure ghee sweets and crunchy namkeen, made fresh and delivered across India.",
};

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function ShopPage(props: PageProps<"/shop">) {
  const sp = await props.searchParams;
  const q = str(sp.q);
  const tag = str(sp.tag);
  const category = str(sp.category);
  const sort = str(sp.sort) || "featured";

  const [all, categories, tags] = await Promise.all([
    getProducts(),
    getCategories(),
    getTags(),
  ]);

  let items = all;
  if (category)
    items = items.filter((p) =>
      (p.categories ?? [p.category]).includes(category),
    );
  if (tag) items = items.filter((p) => p.tags.includes(tag));
  if (q) {
    const query = normalizeSearchQuery(q);
    items = items
      .map((p) => ({ p, score: scoreProductForQuery(p, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ p }) => p);
  }

  function normalizeSearchQuery(s: string) {
    return s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(s: string) {
    return normalizeSearchQuery(s)
      .split(" ")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function editDistanceWithin(a: string, b: string, max: number) {
    // Bounded DP for small fuzzy matching.
    const la = a.length;
    const lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;

    const dp = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) dp[j] = j;

    for (let i = 1; i <= la; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= lb; j++) {
        const temp = dp[j];
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
        prev = temp;
      }
    }
    return dp[lb];
  }

  function scoreProductForQuery(product: (typeof items)[number], query: string) {
    const name = normalizeSearchQuery(product.name);
    const desc = normalizeSearchQuery(product.description ?? "");
    const cat = normalizeSearchQuery(product.categoryLabel ?? "");
    const hay = `${name} ${desc} ${cat}`;

    if (!query) return 0;

    // Phrase / substring matches (fast + strong)
    if (name === query) return 1000;
    if (name.includes(query)) return 300 + Math.min(200, query.length * 5);
    if (cat.includes(query)) return 140 + Math.min(120, query.length * 3);
    if (desc.includes(query)) return 60 + Math.min(80, query.length * 2);

    // Token-based scoring (dynamic)
    const qTokens = tokenize(query);
    const nTokens = new Set(tokenize(name));
    const cTokens = new Set(tokenize(cat));
    const dTokens = new Set(tokenize(desc));

    let score = 0;

    for (const qt of qTokens) {
      if (nTokens.has(qt)) score += 90;
      else if (cTokens.has(qt)) score += 55;
      else if (dTokens.has(qt)) score += 20;

      // prefix match within tokens
      for (const token of [...nTokens]) {
        if (token.startsWith(qt) && qt.length >= 3) {
          score += 35;
        }
      }
      for (const token of [...cTokens]) {
        if (token.startsWith(qt) && qt.length >= 3) {
          score += 20;
        }
      }

      // lightweight fuzzy edit distance on short tokens
      if (qt.length >= 3 && qt.length <= 10) {
        const best = maxTokenEditScore(qt, [...nTokens, ...cTokens]);
        score += best;
      }
    }

    // Slight boost if any token appears somewhere in combined text
    for (const qt of qTokens) {
      if (hay.includes(qt)) score += 8;
    }

    return score;

    function maxTokenEditScore(qt: string, dict: string[]) {
      let best = 0;
      for (const t of dict) {
        const d = editDistanceWithin(qt, t, 2);
        if (d <= 2) {
          // Smaller distance => bigger score
          best = Math.max(best, 40 - d * 12);
        }
      }
      return best;
    }
  }
  items = sortProducts(items, sort);

  const heading = tag
    ? tags.find((t) => t.slug === tag)?.name ?? prettifyTag(tag)
    : "Shop All";
  const categoryName = categories.find((c) => c.slug === category)?.name;

  return (
    <div className="py-10">
      <Container>
        <header className="mb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-saffron-600">
            {categoryName ?? "Our Collection"}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
            {categoryName ? categoryName : heading}
          </h1>
          {q && (
            <p className="mt-2 text-ink-500">
              Showing results for &ldquo;{q}&rdquo;
            </p>
          )}
        </header>

        <ShopControls categories={categories} />

        {items.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-ink-500">
              {items.length} {items.length === 1 ? "product" : "products"}
            </p>
            <ProductGrid products={items} />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-cream-300 bg-white py-20 text-center">
            <p className="font-serif text-xl font-semibold text-maroon-900">
              No products found
            </p>
            <p className="mt-2 text-sm text-ink-500">
              Try a different search or clear your filters.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
