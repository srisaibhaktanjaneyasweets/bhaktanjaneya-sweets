import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCategory, getCategories } from "@/lib/api/categories";
import { getProductsByCategory } from "@/lib/api/products";
import { getCategoryImage } from "@/lib/images";
import { sortProducts } from "@/lib/product";

import { config } from "@/lib/config";

export async function generateStaticParams() {
  const cats = await getCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  props: PageProps<"/collections/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const c = await getCategory(slug);
  if (!c) return { title: "Collection" };
  const url = `${config.siteUrl}/collections/${c.slug}`;
  const desc = c.description ?? `Shop authentic ${c.name} online from Bhaktanjaneya Sweets. Fresh ingredients, pure ghee, nationwide delivery.`;
  return {
    title: `${c.name} — Buy Traditional ${c.name} Online`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: `${c.name} | ${config.businessName}`,
      description: desc,
      url,
      images: [{ url: `${config.siteUrl}/images/logo.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.name} | ${config.businessName}`,
      description: desc,
    },
  };
}

export default async function CollectionPage(
  props: PageProps<"/collections/[slug]">,
) {
  const { slug } = await props.params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const products = sortProducts(await getProductsByCategory(slug), "featured");

  return (
    <div className="pb-12">
      {/* Category hero */}
      <section className="bg-gradient-to-br from-maroon-800 to-maroon-900">
        <Container>
          <div className="flex items-center gap-6 py-12 sm:py-16">
            <div className="hidden h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-cream-50/10 ring-1 ring-cream-50/20 sm:flex">
              <Image
                src={getCategoryImage(category)}
                alt={category.name}
                width={80}
                height={80}
                className="h-20 w-20 object-contain"
              />
            </div>
            <div>
              <nav className="mb-2 text-xs text-cream-100/70">
                <Link href="/" className="hover:text-saffron-300">
                  Home
                </Link>{" "}
                / <span className="text-cream-100">{category.name}</span>
              </nav>
              <h1 className="font-serif text-3xl font-bold text-cream-50 sm:text-4xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-2 max-w-xl text-sm text-cream-100/85">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <div className="py-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-ink-500">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
            <Link
              href="/shop"
              className="text-sm font-semibold text-maroon-800 underline-offset-4 hover:text-saffron-600 hover:underline"
            >
              View all products
            </Link>
          </div>

          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="rounded-2xl border border-dashed border-cream-300 bg-white py-20 text-center">
              <p className="font-serif text-xl font-semibold text-maroon-900">
                Coming soon
              </p>
              <p className="mt-2 text-sm text-ink-500">
                We&apos;re adding products to this collection. Check back shortly!
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
