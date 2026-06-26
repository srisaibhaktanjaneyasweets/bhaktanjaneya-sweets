import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { FeaturedShowcase } from "@/components/home/FeaturedShowcase";
import { OfferBanner } from "@/components/home/OfferBanner";
import { Testimonials } from "@/components/home/Testimonials";
import { InstagramReels } from "@/components/home/InstagramReels";
import { BlogTeasers } from "@/components/home/BlogTeasers";
import { NewsletterCTA } from "@/components/home/NewsletterCTA";
import { getProducts } from "@/lib/api/products";
import { getFeaturedTags } from "@/lib/api/tags";
import { getLiveGoogleReviews } from "@/lib/google-reviews";
import { getLiveInstagramReels } from "@/lib/instagram-reels";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [products, featuredTags, liveReviewsData, liveReels] = await Promise.all([
    getProducts(),
    getFeaturedTags(),
    getLiveGoogleReviews(),
    getLiveInstagramReels(),
  ]);

  // Build a carousel for each admin-featured tag, keeping only those that
  // actually have products so a featured tag never shows unrelated items.
  const featuredRails = featuredTags
    .map((t) => ({
      slug: t.slug,
      title: t.name,
      products: products.filter((p) => p.tags.includes(t.slug)),
    }))
    .filter((rail) => rail.products.length > 0);

  // Fall back to a generic "Top Picks" rail when nothing is featured yet (or no
  // featured tag has products) so the home page never looks bare.
  const tagRails = featuredRails.length
    ? featuredRails
    : [{ slug: "", title: "Top Picks", products: products.slice(0, 6) }];

  return (
    <>
      <Hero />
      <TrustStrip />
      {tagRails.map((rail, i) => {
        if (i === 0) {
          // Flagship grid: feature the tag's picks first, then pad with other
          // products so the two-row grid stays full even when the tag is thin.
          const picked = rail.products.slice(0, 8);
          const seen = new Set(picked.map((p) => p.id));
          const flagship =
            picked.length >= 8
              ? picked
              : [
                  ...picked,
                  ...products
                    .filter((p) => !seen.has(p.id))
                    .slice(0, 8 - picked.length),
                ];
          return (
            <div key={rail.slug || i}>
              <FeaturedShowcase
                eyebrow="Handpicked for you"
                title={rail.title}
                subtitle="Freshly made sweets, namkeen and festive favourites — handpicked and ready to gift."
                viewAllHref={rail.slug ? `/shop?tag=${rail.slug}` : "/shop"}
                products={flagship}
              />
              {/* Slot the offer banner in after the flagship grid. */}
              <OfferBanner />
            </div>
          );
        }
        return (
          <div key={rail.slug || i}>
            <ProductCarousel
              eyebrow="More to love"
              title={rail.title}
              viewAllHref={rail.slug ? `/shop?tag=${rail.slug}` : "/shop"}
              products={rail.products}
            />
          </div>
        );
      })}
      <Testimonials
        reviews={liveReviewsData.reviews}
        ratingSummary={liveReviewsData.ratingSummary}
      />
      <InstagramReels reels={liveReels} />
      <BlogTeasers />
      <NewsletterCTA />
    </>
  );
}


