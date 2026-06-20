import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, Truck, Sparkles, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Rating } from "@/components/ui/Rating";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import {
  getProducts,
  getProductBySlug,
  getProductsByCategory,
} from "@/lib/api/products";
import { priceRange } from "@/lib/product";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/product/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product" };
  return {
    title: p.name,
    description: p.description,
    openGraph: { title: p.name, description: p.description, images: p.images },
  };
}

const features = [
  { icon: Truck, title: "Free shipping", text: "On orders over ₹700" },
  { icon: Sparkles, title: "Freshly made", text: "Small-batch quality" },
  { icon: MessageCircle, title: "WhatsApp support", text: "Quick order help" },
];

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  const related = (await getProductsByCategory(product.category)).filter(
    (p) => p.id !== product.id,
  );
  const { min, max } = priceRange(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    category: product.categoryLabel ?? product.category,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: min,
      highPrice: max,
      offerCount: product.variants.length,
    },
  };

  return (
    <div className="pb-16 pt-8">
      <script
        type="application/ld+json"
        // Escape "<" so a "</script>" in any field (e.g. product name) can't break out.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Container>
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-ink-400">
          <Link href="/" className="hover:text-maroon-800">
            Home
          </Link>{" "}
          /{" "}
          <Link
            href={`/collections/${product.category}`}
            className="hover:text-maroon-800"
          >
            {product.categoryLabel ?? product.category}
          </Link>{" "}
          / <span className="text-ink-700">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} category={product.category} />

          <div>
            {product.categoryLabel && (
              <span className="text-sm font-medium uppercase tracking-wide text-saffron-600">
                {product.categoryLabel}
              </span>
            )}
            <h1 className="mt-1 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-3">
              <Rating value={product.rating} count={product.reviewCount} />
            </div>
            <p className="mt-4 leading-relaxed text-ink-700">
              {product.description}
            </p>

            {product.badges && product.badges.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {product.badges.map((b) => (
                  <li
                    key={b}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-700"
                  >
                    <Check size={16} className="text-leaf-600" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            <ProductPurchasePanel product={product} />

            <div className="mt-8 grid gap-4 rounded-2xl bg-cream-100 p-5 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-saffron-600">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-maroon-900">
                      {title}
                    </p>
                    <p className="text-xs text-ink-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <ProductCarousel
          eyebrow="More to love"
          title="You may also like"
          products={related}
          viewAllHref={`/collections/${product.category}`}
        />
      )}
    </div>
  );
}
