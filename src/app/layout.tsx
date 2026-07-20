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
    default: `${config.businessName} — Pure Ghee Sweets & Crunchy Namkeen`,
    template: `%s | ${config.businessName}`,
  },
  description:
    `${config.tagline} Order fresh traditional Indian sweets and namkeen online or instantly on WhatsApp.`,
  keywords: [
    "Indian sweets",
    "namkeen",
    "pure ghee sweets",
    "kaju patisa",
    "Agra mixture",
    config.businessName,
  ],
  openGraph: {
    title: `${config.businessName} — Pure Ghee Sweets & Crunchy Namkeen`,
    description: config.tagline,
    type: "website",
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
