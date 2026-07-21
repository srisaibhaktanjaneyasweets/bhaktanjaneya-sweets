import type { Metadata } from "next";
import { Playfair_Display, Mulish } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { config } from "@/lib/config";
import { ToastHost } from "@/components/ui/ToastHost";


const heading = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const body = Mulish({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  // iOS Safari otherwise auto-detects phone numbers / emails / addresses and
  // restyles them (different colour, underline), which makes the footer and
  // contact details look different on a real iPhone than in dev tools.
  formatDetection: { telephone: false, email: false, address: false },
  title: {
    default: `${config.businessName} — Pure Ghee Sweets & Traditional Namkeen`,
    template: `%s | ${config.businessName}`,
  },
  description:
    `${config.tagline} Buy authentic Tapeswaram Kaja, Gottam Kaja, Madatha Kaja, Kaju Sweets, Ariselu, and Putharekulu online with pan-India delivery.`,
  keywords: [
    "Bhaktanjaneya Sweets",
    "Sri Sai Bhaktanjaneya Sweets",
    "Sri Sai Bhakthanjaneya Sweets",
    "bhaktanjaneyasweets.in",
    "Tapeswaram Kaja",
    "Gottam Kaja",
    "Madatha Kaja",
    "pure ghee sweets",
    "Andhra sweets online",
    "traditional Indian sweets",
    "namkeen",
    "buy sweets online India",
  ],
  openGraph: {
    title: `${config.businessName} — Pure Ghee Sweets & Traditional Namkeen`,
    description: `${config.tagline} Buy authentic Tapeswaram Kaja, Gottam Kaja, Kaju Sweets, and Putharekulu online.`,
    url: config.siteUrl,
    siteName: config.businessName,
    images: [
      {
        url: `${config.siteUrl}/images/og-logo.jpg`,
        width: 500,
        height: 500,
        alt: config.businessName,
        type: "image/jpeg",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${config.businessName} — Pure Ghee Sweets`,
    description: config.tagline,
    images: [`${config.siteUrl}/images/og-logo.jpg`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} h-full`}
    >
      <head>
        <meta property="og:image" content={`${config.siteUrl}/images/og-logo.jpg`} />
        <meta property="og:image:secure_url" content={`${config.siteUrl}/images/og-logo.jpg`} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="500" />
        <meta property="og:image:height" content="500" />
        <link rel="image_src" href={`${config.siteUrl}/images/og-logo.jpg`} />
      </head>
      <body className="flex min-h-full flex-col bg-cream-50 text-ink-900 antialiased">
        <Providers>
          <SiteChrome
            announcement={<AnnouncementBar />}
            header={<Header />}
            categoryNav={<CategoryNav />}
            footer={<Footer />}
            drawer={<CartDrawer />}
          >
            {children}
          </SiteChrome>
          <ToastHost />
        </Providers>
      </body>
    </html>
  );
}
