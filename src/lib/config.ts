// Central runtime config. All values that the backend/owner will change live
// here, sourced from environment variables (see .env.example).

export const config = {
  businessName: "Bhaktanjaneya Sweets",
  tagline: "Pure ghee sweets & crunchy namkeen, made fresh.",

  /** Business WhatsApp number in international format, digits only. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999",

  /** Public site URL, used for SEO/Open Graph absolute URLs. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /** Link to the business's Google reviews / Maps listing. Set this to your real
   *  Google Business Profile URL so the "Read all reviews on Google" button works.
   *  Falls back to a Google search until configured. */
  googleReviewsUrl:
    process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL ??
    "https://share.google/VtpbijkHqNKIoOb48",

  /** Base URL for the Next.js API routes. Empty env resolves to /api. */
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/$/, ""),

  /** Razorpay publishable key id (phase 2). Secret stays on the backend. */
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",

  /** True when Razorpay env is fully configured (frontend only checks publishable key presence). */
  razorpayEnabled:
    Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) &&
    process.env.NODE_ENV !== "test",

  currency: "INR" as const,
  freeShippingThreshold: 700,
  /** Flat delivery fee (INR) when cart is below freeShippingThreshold. */
  shippingFee: 60,

  contact: {
    phone: "+91 99999 99999",
    email: "orders@bhaktanjaneyasweets.com",
    address: "Hyderabad, Telangana, India",
  },

  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/",
  },
};

export type AppConfig = typeof config;
