import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { OfferBanner } from "@/components/home/OfferBanner";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { InstagramReels } from "@/components/home/InstagramReels";
import { BlogTeasers } from "@/components/home/BlogTeasers";
import { NewsletterCTA } from "@/components/home/NewsletterCTA";
import { getProducts } from "@/lib/api/products";
import { getFeaturedTags } from "@/lib/api/tags";
import { getLiveGoogleReviews } from "@/lib/google-reviews";
import { getLiveInstagramReels } from "@/lib/instagram-reels";
import { config } from "@/lib/config";
import type { Metadata } from "next";

// ISR: serve a cached home page and rebuild it at most once a minute. Repeat
// visits are instant instead of re-running every Supabase query + third-party
// call on each request. Admin catalog edits appear within ~60s.
export const revalidate = 60;

export const metadata: Metadata = {
  title: `${config.businessName} — Pure Ghee Sweets & Crunchy Namkeen`,
  description:
    `${config.tagline} Order fresh traditional Indian sweets, laddu, kaja and namkeen online or instantly on WhatsApp, delivered across India.`,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${config.businessName} — Pure Ghee Sweets & Crunchy Namkeen`,
    description: config.tagline,
    type: "website",
    url: config.siteUrl,
  },
};

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

  const tagShopHref = (slug: string) =>
    slug ? `/shop?tag=${encodeURIComponent(slug)}` : "/shop";

  // Dedicated "Sweets" rail. Product categories don't map 1:1 to the storefront
  // category slugs, so match every category slug that actually holds sweets.
  const SWEET_CATEGORY_SLUGS = ["sweets", "andhra-specials", "dryfruit-sweets"];
  const sweetsProducts = products
    .filter(
      (p) =>
        SWEET_CATEGORY_SLUGS.includes(p.category) ||
        p.categories.some((c) => SWEET_CATEGORY_SLUGS.includes(c)),
    )
    .slice(0, 12);

  return (
    <>
      <Hero />
      <TrustStrip />
      {tagRails.map((rail, i) => {
        if (i === 0) {
          return (
            <div key={rail.slug || i}>
              <ProductCarousel
                eyebrow="Handpicked for you"
                title={rail.title}
                viewAllHref={tagShopHref(rail.slug)}
                products={rail.products}
                align="center"
              />
              {/* New dedicated Sweets rail, directly below Our Specials. */}
              {sweetsProducts.length > 0 && (
                <ProductCarousel
                  eyebrow="Pure ghee, made fresh"
                  title="Sweets"
                  viewAllHref="/shop"
                  products={sweetsProducts}
                />
              )}
              {/* Slot the offer banner in after the sweets rail. */}
              <OfferBanner />
            </div>
          );
        }
        return (
          <div key={rail.slug || i}>
            <ProductCarousel
              eyebrow="More to love"
              title={rail.title}
              viewAllHref={tagShopHref(rail.slug)}
              products={rail.products}
            />
          </div>
        );
      })}
      <ReviewsSection
        reviews={liveReviewsData.reviews}
        ratingSummary={liveReviewsData.ratingSummary}
      />
      <InstagramReels reels={liveReels} />
      <BlogTeasers />
      <NewsletterCTA />

      {/* SEO: Organization + aggregate rating structured data (Google rich results). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: config.businessName,
            url: config.siteUrl,
            description: config.tagline,
            logo: `${config.siteUrl}/images/logo.png`,
            telephone: config.contact.phone,
            email: config.contact.email,
            address: {
              "@type": "PostalAddress",
              addressLocality: config.contact.address,
              addressCountry: "IN",
            },
            sameAs: [
              config.social.instagram,
              config.social.facebook,
              config.social.youtube,
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: liveReviewsData.ratingSummary.average,
              reviewCount: liveReviewsData.ratingSummary.count,
            },
          }),
        }}
      />
    </>
  );
}


