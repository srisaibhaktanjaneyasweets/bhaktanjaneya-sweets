const CATEGORY_DEFAULTS: Record<string, string> = {
  sweets: "/images/categories/sweets.svg",
  snacks: "/images/categories/snacks.svg",
  namkeen: "/images/categories/namkeen.svg",
  "special-combos": "/images/categories/special-combos.svg",
  "veg-pickles": "/images/categories/veg-pickles.svg",
  "nonveg-pickles": "/images/categories/nonveg-pickles.svg",
  podis: "/images/categories/podis.svg",
};

/** Default product placeholders by category. */
const PRODUCT_DEFAULTS: Record<string, string> = {
  sweets: "/images/products/sweets-placeholder.svg",
  snacks: "/images/products/namkeen-placeholder.svg",
  namkeen: "/images/products/namkeen-placeholder.svg",
  "special-combos": "/images/products/sweets-placeholder.svg",
  "veg-pickles": "/images/products/namkeen-placeholder.svg",
  "nonveg-pickles": "/images/products/namkeen-placeholder.svg",
  podis: "/images/products/namkeen-placeholder.svg",
};

export function defaultCategoryImage(slug: string): string {
  return CATEGORY_DEFAULTS[slug] ?? CATEGORY_DEFAULTS.sweets;
}

export function defaultProductImage(categorySlug: string): string {
  return PRODUCT_DEFAULTS[categorySlug] ?? PRODUCT_DEFAULTS.sweets;
}

export function getCategoryImage(category: { slug: string; image?: string | null }): string {
  const uploaded = proxyStorageImage(category.image?.trim() ?? "");
  return uploaded || defaultCategoryImage(category.slug);
}

export function getProductImage(product: { images?: string[]; category: string }): string {
  const uploaded = product.images?.map((img) => proxyStorageImage(img?.trim() ?? "")).find(Boolean);
  return uploaded || defaultProductImage(product.category);
}

export function getProductImages(product: { images?: string[]; category: string }): string[] {
  const uploaded = (product.images ?? [])
    .map((img) => proxyStorageImage(img?.trim() ?? ""))
    .filter((img) => img?.trim());
  return uploaded.length ? uploaded : [defaultProductImage(product.category)];
}

/** Route Supabase storage URLs through our same-origin proxy so the browser
 * never depends on Next image optimization or the bucket's public URL shape.
 */
export function proxyStorageImage(url: string): string {
  if (!url || url.startsWith("/") || url.startsWith("data:")) return url;
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname.endsWith("supabase.co") &&
      parsed.pathname.startsWith("/storage/v1/object/public/")
    ) {
      return `/api/storage-image?url=${encodeURIComponent(url)}`;
    }
  } catch {
    return url;
  }
  return url;
}
