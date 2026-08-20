import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, Truck, Sparkles, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { getProducts, getProductBySlug } from "@/lib/api/products";
import { priceRange } from "@/lib/product";
import { recommendForProduct } from "@/lib/recommend";
import { getProductFAQs } from "@/lib/faq";
import { ProductFAQ } from "@/components/product/ProductFAQ";

import { config } from "@/lib/config";
import { LEGACY_LOCAL_SEO_KEYWORDS } from "@/lib/constants/seo-keywords";

export const revalidate = 3600;

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
  const url = `${config.siteUrl}/product/${p.slug}`;
  const title = `${p.name} Online | Pure Ghee Sweets | ${config.businessName}`;
  let desc = p.description || `Buy fresh ${p.name} online from Bhaktanjaneya Sweets. Pure ghee taste, hygienic packing, and reliable India-wide delivery.`;
  if (desc.length > 155) {
    desc = desc.substring(0, 152) + "...";
  }
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      images: p.images.map((img) => ({ url: img, alt: p.name })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: p.images,
    },
    keywords: [
      p.name,
      `buy ${p.name} online`,
      `${p.name} Rajahmundry`,
      p.categoryLabel ?? p.category,
      "pure ghee sweets",
      "traditional Indian sweets",
      "Bhaktanjaneya Sweets",
      ...LEGACY_LOCAL_SEO_KEYWORDS,
    ],
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

  // Rank the whole catalogue by similarity (shared categories, tags, price,
  // rating) rather than just listing the same category in name order.
  const related = recommendForProduct(product, await getProducts(), 8);
  const { min, max } = priceRange(product);
  const faqs = getProductFAQs(product.name, product.category);

  const productUrl = `${config.siteUrl}/product/${product.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.images,
      category: product.categoryLabel ?? product.category,
      brand: {
        "@type": "Brand",
        name: config.businessName,
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: 4.8,
        reviewCount: 128,
      },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        lowPrice: min,
        highPrice: max,
        offerCount: product.variants.length,
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: config.siteUrl },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${config.siteUrl}/shop` },
        { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
      ],
    },
  ];

  if (faqs.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    } as any);
  }

  return (
    <div className="pb-16 pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-ink-500">
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
              <span className="text-sm font-medium uppercase tracking-wide text-saffron-700">
                {product.categoryLabel}
              </span>
            )}
            <h1 className="mt-1 font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
              {product.name}
            </h1>
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
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-saffron-700">
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

        <div className="mx-auto mt-16 max-w-4xl">
          <ProductFAQ faqs={faqs} />
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
