import type { CartItem, Product, Variant } from "./types";
import { getProductImage } from "./images";

/** Variants as a guaranteed array — guards against null/undefined from the API. */
function variantsOf(p: Product): Variant[] {
  return Array.isArray(p.variants) ? p.variants : [];
}

/** Turn a tag slug into a human label, e.g. "best-seller" -> "Best Seller". */
export function prettifyTag(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Tags as a guaranteed array — guards against null/undefined from the API. */
function tagsOf(p: Product): string[] {
  return Array.isArray(p.tags) ? p.tags : [];
}

/**
 * Display label for a variant, including the piece count when set, e.g.
 * "250 g · 5 pcs". Falls back to the piece count alone, then a neutral
 * "Pack" label so size pills are never blank.
 */
export function variantLabel(v: Pick<Variant, "label" | "pieces"> | null | undefined): string {
  const base = (v?.label ?? "").trim();
  const count = typeof v?.pieces === "number" && v.pieces > 0 ? v.pieces : 0;
  const pcs = count ? `${count} pcs` : "";
  // Skip the suffix if the label already mentions pieces (e.g. "12 pieces").
  if (base && pcs && !/\d\s*(pcs?|pieces?)\b/i.test(base)) return `${base} · ${pcs}`;
  return base || pcs || "Pack";
}

/** Lowest-priced variant — used as the quick-add default on cards. */
export function defaultVariant(p: Product): Variant {
  return [...variantsOf(p)].sort((a, b) => a.price - b.price)[0] ?? {
    id: "",
    label: "",
    price: 0,
    stock: 0,
  };
}


/** Min/max selling price across a product's variants. */
export function priceRange(p: Product) {
  const prices = variantsOf(p).map((v) => v.price).filter((n) => Number.isFinite(n));
  if (prices.length === 0) {
    return { min: 0, max: 0, hasRange: false };
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, hasRange: min !== max };
}


/** True if any variant has stock. */
export function inStock(p: Product): boolean {
  return variantsOf(p).some((v) => v.stock > 0);
}

/** Best (highest) discount percentage across variants, or 0. */
export function bestDiscountPct(p: Product): number {
  return variantsOf(p).reduce((best, v) => {
    if (!v.mrp || v.mrp <= v.price) return best;
    const pct = Math.round(((v.mrp - v.price) / v.mrp) * 100);
    return Math.max(best, pct);
  }, 0);
}

const TAG_WEIGHT: Record<string, number> = {
  "best-seller": 3,
  "top-pick": 2,
  combo: 1,
  new: 1,
};

/** Higher = more prominent in the default "featured" sort. */
export function featuredScore(p: Product): number {
  return tagsOf(p).reduce((s, t) => s + (TAG_WEIGHT[t] ?? 0), 0);
}

/** Sort a product list by the shop's sort key. Returns a new array. */
export function sortProducts(items: Product[], sort: string): Product[] {
  const arr = [...items];
  const availability = (p: Product) => (inStock(p) ? 0 : 1);
  const byName = (a: Product, b: Product) => (a.name ?? "").localeCompare(b.name ?? "");
  switch (sort) {
    case "price-asc":
      return arr.sort((a, b) => availability(a) - availability(b) || priceRange(a).min - priceRange(b).min || byName(a, b));
    case "price-desc":
      return arr.sort((a, b) => availability(a) - availability(b) || priceRange(b).min - priceRange(a).min || byName(a, b));
    default:
      return arr.sort(
        (a, b) =>
          availability(a) - availability(b) ||
          featuredScore(b) - featuredScore(a) ||
          byName(a, b),
      );
  }
}

/** Build a cart line from a product + chosen variant. */
export function toCartItem(p: Product, v: Variant, quantity = 1): CartItem {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    image: getProductImage(p),
    variantId: v.id,
    variantLabel: variantLabel(v),
    price: v.price,
    quantity,
  };
}
