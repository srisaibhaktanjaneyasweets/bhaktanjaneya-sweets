export const config = {
  businessName: "Bhaktanjaneya Sweets",
  tagline: "Pure ghee sweets & crunchy namkeen, made fresh.",

  /** Business WhatsApp number in international format, digits only. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999",

  /** Public site URL, used for SEO/Open Graph absolute URLs. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /** Link to the business's Google reviews / Maps listing. */
  googleReviewsUrl:
    process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL ??
    "https://share.google/VtpbijkHqNKIoOb48",

  /** Base URL for the Next.js API routes. Empty env resolves to /api. */
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, ""),

  /** Razorpay publishable key id. Secret stays on the server. */
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",

  /** True when Google sign-in has been enabled for this deployment. */
  googleOAuthEnabled: process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_OAUTH_ENABLED === "true",

  /** True when Razorpay env is fully configured. */
  razorpayEnabled:
    Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) &&
    process.env.NODE_ENV !== "test",

  /** Max number of tags that can be featured as carousels on the home page. */
  maxFeaturedTags: 2,

  currency: "INR" as const,
  freeShippingThreshold: 700,
  /** Flat delivery fee (INR) when cart is below freeShippingThreshold. */
  shippingFee: 60,

  contact: {
    phone: "+91 90302 74345",
    email: "orders@bhaktanjaneyasweets.com",
    address: "Rajamahendravaram, Andhra Pradesh, India",
  },

  social: {
    instagram: "https://www.instagram.com/bhaktanjaneyasweets.in/",
    facebook: "https://www.facebook.com/BhakthanjaneyaSweets/",
    youtube: "https://www.youtube.com/@bhaktanjaneyasweets9949",
  },

  /** Customer-support hours, shown on the Contact page. */
  supportHours: "Mon - Sat, 9:00 AM - 8:00 PM",
};

export type AppConfig = typeof config;
