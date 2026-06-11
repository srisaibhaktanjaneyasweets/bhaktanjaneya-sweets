import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { OfferBanner } from "@/components/home/OfferBanner";
import { ValueProps } from "@/components/home/ValueProps";
import { Testimonials } from "@/components/home/Testimonials";
import { BlogTeasers } from "@/components/home/BlogTeasers";
import { NewsletterCTA } from "@/components/home/NewsletterCTA";
import { getProducts } from "@/lib/api/products";

export default async function HomePage() {
  const products = await getProducts();

  const topPicks = products.filter((p) => p.tags.includes("top-pick"));
  const bestSellers = products.filter((p) => p.tags.includes("best-seller"));

  return (
    <>
      <Hero />
      <TrustStrip />
      <ProductCarousel
        eyebrow="Handpicked for you"
        title="Top Picks"
        viewAllHref="/shop?tag=top-pick"
        products={topPicks.length ? topPicks : products.slice(0, 6)}
      />
      <OfferBanner />
      <ProductCarousel
        eyebrow="Customer favourites"
        title="Best Sellers"
        viewAllHref="/shop?tag=best-seller"
        products={bestSellers.length ? bestSellers : products.slice(0, 6)}
      />
      <ValueProps />
      <Testimonials />
      <BlogTeasers />
      <NewsletterCTA />
    </>
  );
}
