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
import { getManagedInstagramReels } from "@/lib/managed-instagram-reels";
import { config } from "@/lib/config";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Link from "next/link";
import { getOfferBannerSettingsServer } from "@/lib/api/offer-banner";
import { getBusinessConfigServer } from "@/lib/server/business-config";
import { LEGACY_LOCAL_SEO_KEYWORDS } from "@/lib/constants/seo-keywords";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Rajahmundry & Tapeswaram Sweets Online | ${config.businessName}`,
  description:
    "Order pure ghee Rajahmundry and Tapeswaram sweets online. Buy Madatha Kaja, Putharekulu, festival sweets, and fresh namkeen with fast WhatsApp support and pan-India delivery.",
  keywords: [
    "Rajahmundry sweets",
    "Tapeswaram sweets",
    "Tapeswaram kaja",
    "pure ghee sweets online",
    "Bhaktanjaneya Sweets",
    ...LEGACY_LOCAL_SEO_KEYWORDS,
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `Rajahmundry & Tapeswaram Sweets Online | ${config.businessName}`,
    description: "Buy authentic Tapeswaram Kaja, pure ghee sweets, and namkeen online with reliable India-wide delivery.",
    type: "website",
    url: config.siteUrl,
  },
};

export default async function HomePage() {
  const [products, featuredTags, liveReviewsData, reels, offerBannerSettings, businessConfig] = await Promise.all([
    getProducts(),
    getFeaturedTags(),
    getLiveGoogleReviews(),
    getManagedInstagramReels(),
    getOfferBannerSettingsServer(),
    getBusinessConfigServer(),
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
              <OfferBanner settings={offerBannerSettings} />

              <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-soft sm:p-6">
                  <h2 className="font-serif text-xl font-bold text-maroon-900">
                    Popular Sweets Searches
                  </h2>
                  <p className="mt-1 text-sm text-ink-600">
                    Explore our most searched sweets and festive favorites.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {[
                      { label: "Tapeswaram Kaja", href: "/shop?q=tapeswaram+kaja" },
                      { label: "Madatha Kaja", href: "/shop?q=madatha+kaja" },
                      { label: "Rajahmundry Sweets", href: "/shop?q=rajahmundry+sweets" },
                      { label: "Putharekulu", href: "/shop?q=putharekulu" },
                      { label: "Dry Fruit Sweets", href: "/shop?q=dry+fruit+sweets" },
                      { label: "Festival Sweets", href: "/shop?q=festival+sweets" },
                      { label: "Khara Items", href: "/shop?q=khara+items" },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="inline-flex items-center rounded-full border border-cream-300 bg-cream-50 px-3.5 py-1.5 text-sm font-medium text-maroon-800 hover:border-saffron-300 hover:bg-saffron-50"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
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
      <InstagramReels reels={reels} />
      <BlogTeasers />
      <NewsletterCTA />

      {/* SEO: SweetShop + Organization + aggregate rating structured data (Google rich results & AI crawler brand mapping). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SweetShop",
            name: config.businessName,
            alternateName: [
              "Tapeswaram Sweets",
              "Tapeswaram Kaja",
              "Sri Sai Bhaktanjaneya Sweets",
              "Sri Sai Bhakthanjaneya Sweets",
              "Srisai Bhaktanjaneya Sweets",
              "Bhaktanjaneya Sweets Rajahmundry",
              "Bhaktanjaneya Sweets Tapeswaram Kaja",
            ],
            url: config.siteUrl,
            description: "Authentic Tapeswaram Sweets, Tapeswaram Kaja, and pure ghee traditional Andhra sweets.",
            logo: `${config.siteUrl}/images/logo.png`,
            image: `${config.siteUrl}/images/hero/hero-laddu.webp`,
            telephone: businessConfig.phone,
            email: businessConfig.email,
            priceRange: "₹₹",
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                opens: "09:00",
                closes: "21:30"
              }
            ],
            geo: {
              "@type": "GeoCoordinates",
              latitude: 17.0005,
              longitude: 81.8040
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "Rajamahendravaram",
              addressRegion: "Andhra Pradesh",
              addressCountry: "IN",
            },
            sameAs: [
              ...businessConfig.socials.map((s: { url: string }) => s.url),
              config.googleReviewsUrl,
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: liveReviewsData.ratingSummary.average,
              reviewCount: liveReviewsData.ratingSummary.count,
            },
          }),
        }}
      />
      <Analytics/>
      <SpeedInsights/>
    </>
  );
}


