import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { getTags } from "@/lib/api/tags";
import { sortProducts, prettifyTag } from "@/lib/product";
import { getCategoryImage } from "@/lib/images";

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

function normalizeSearchQuery(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tokenize(s: string) {
  return normalizeSearchQuery(s)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

function editDistanceWithin(a: string, b: string, max: number) {
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

function scoreProductForQuery(product: any, query: string) {
  const name = normalizeSearchQuery(product.name);
  const desc = normalizeSearchQuery(product.description ?? "");
  const cat = normalizeSearchQuery(product.categoryLabel ?? "");
  const hay = `${name} ${desc} ${cat}`;

  if (!query) return 0;

  if (name === query) return 1000;
  if (name.includes(query)) return 300 + Math.min(200, query.length * 5);
  if (cat.includes(query)) return 140 + Math.min(120, query.length * 3);
  if (hay.includes(query)) return 50 + Math.min(50, query.length * 2);

  const queryTokens = tokenize(query);
  const nameTokens = tokenize(product.name);

  if (queryTokens.length > 0 && nameTokens.length > 0) {
    let best = 0;
    for (const qt of queryTokens) {
      if (qt.length < 3) continue;
      for (const nt of nameTokens) {
        if (nt.includes(qt) || qt.includes(nt)) {
          best += 40;
        } else if (editDistanceWithin(nt, qt, 1) <= 1) {
          best += 20;
        }
      }
    }
    return best;
  }
  return 0;
}

export async function ShopResults({ searchParams }: { searchParams: any }) {
  const q = str(searchParams.q);
  const tag = str(searchParams.tag);
  const category = str(searchParams.category);
  const sort = str(searchParams.sort) || "featured";

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
  } else {
    items = sortProducts(items, sort);
  }

  const heading = tag
    ? tags.find((t) => t.slug === tag)?.name ?? prettifyTag(tag)
    : "Shop All";
  const categoryObj = categories.find((c) => c.slug === category);
  const categoryName = categoryObj?.name;
  const categoryImg = categoryObj ? getCategoryImage(categoryObj) : "/images/hero/hero-laddu.png";

  return (
    <>
      <section className="relative mx-4 mb-8 overflow-hidden rounded-3xl bg-maroon-950 sm:mx-6 md:mx-8">
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
          <div className="py-12 text-left sm:py-16">
            <p className="text-xs font-bold uppercase tracking-widest text-saffron-400 sm:text-sm">
              {categoryName ? "Collection" : "Shop"}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-cream-50 drop-shadow-sm sm:text-5xl">
              {categoryName ? categoryName : heading}
            </h1>
            {q ? (
              <p className="mt-3 text-sm font-medium text-cream-100/90">
                Showing results for &ldquo;<span className="font-semibold text-saffron-300">{q}</span>&rdquo;
              </p>
            ) : categoryObj?.description ? (
              <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-cream-100/85">
                {categoryObj.description}
              </p>
            ) : (
              <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-cream-100/85">
                Explore our authentic traditional sweets, crispy mixtures, pickles, and combo packs freshly prepared with pure ghee.
              </p>
            )}
          </div>
        </Container>
      </section>

      <Container>
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
    </>
  );
}
