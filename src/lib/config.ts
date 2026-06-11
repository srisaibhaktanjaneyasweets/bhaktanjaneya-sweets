// Central runtime config. All values that the backend/owner will change live
// here, sourced from environment variables (see .env.example).

export const config = {
  businessName: "Bhaktanjaneya Sweets",
  tagline: "Pure ghee sweets & crunchy namkeen, made fresh.",

  /** Business WhatsApp number in international format, digits only. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999",

  /** Public site URL, used for SEO/Open Graph absolute URLs. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /** Optional base URL for the Next API. Empty means same-origin /api routes. */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",

  /** Razorpay publishable key id (phase 2). Secret stays on the backend. */
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",

  currency: "INR" as const,
  freeShippingThreshold: 700,

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
