import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ShopControls } from "@/components/shop/ShopControls";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { getTags } from "@/lib/api/tags";
import { sortProducts, prettifyTag } from "@/lib/product";
import { getCategoryImage } from "@/lib/images";

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
  const categoryObj = categories.find((c) => c.slug === category);
  const categoryName = categoryObj?.name;
  const categoryImg = categoryObj ? getCategoryImage(categoryObj) : "/images/hero/hero-laddu.png";

  return (
    <div className="pb-10">
      {/* Category/Shop Hero Banner */}
      <section className="relative overflow-hidden bg-maroon-950 mb-8 rounded-3xl mx-4 sm:mx-6 md:mx-8">
        {/* Background Image with Overlay */}
        {categoryImg && (
          <div className="absolute inset-0 z-0">
            <img
              src={categoryImg}
              alt={categoryName ? categoryName : heading}
              className="h-full w-full object-cover object-center opacity-90 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-maroon-950 via-maroon-950/85 to-maroon-950/30 md:to-transparent" />
          </div>
        )}
        <Container className="relative z-10">
          <div className="py-12 sm:py-16 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-saffron-400 sm:text-sm">
              {categoryName ? "Collection" : "Shop"}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-cream-50 sm:text-5xl drop-shadow-sm">
              {categoryName ? categoryName : heading}
            </h1>
            {q ? (
              <p className="mt-3 text-sm text-cream-100/90 font-medium">
                Showing results for &ldquo;<span className="text-saffron-300 font-semibold">{q}</span>&rdquo;
              </p>
            ) : categoryObj?.description ? (
              <p className="mt-3 max-w-xl text-sm text-cream-100/85 font-medium leading-relaxed">
                {categoryObj.description}
              </p>
            ) : (
              <p className="mt-3 max-w-xl text-sm text-cream-100/85 font-medium leading-relaxed">
                Explore our authentic traditional sweets, crispy mixtures, pickles, and combo packs freshly prepared with pure ghee.
              </p>
            )}
          </div>
        </Container>
      </section>

      <Container>
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
