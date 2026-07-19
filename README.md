# Bhaktanjaneya Sweets

Premium storefront and admin dashboard for Bhaktanjaneya Sweets, built with Next.js, Supabase, Razorpay, and Tailwind CSS.

## What It Includes

- Storefront pages for home, shop, collections, product details, cart, blog, FAQ, contact, bulk orders, account, policies, and order tracking.
- Admin dashboard for products, categories, tags, offers, blog posts, orders, customers, uploads, and featured homepage content.
- Supabase-backed API routes for catalog, orders, auth, admin data, uploads, pincode checks, and payments.
- OTP-style customer login, admin JWT sessions, cart persistence, serviceable-area checks, and saved customer addresses.
- Email/password customer login with optional Google OAuth through Supabase, verified-email sign-in, and mandatory phone capture during checkout.
- Razorpay order creation and payment verification handled server-side.
- Google reviews and Instagram reels sections with curated fallbacks and optional live server-side sync.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- Razorpay
- Embla Carousel
- Lucide React

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Environment

Create `.env.local` from `.env.example` and fill in the values needed for your environment.

Required for a working Supabase app:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_TOKEN_SECRET=
NEXT_PUBLIC_SUPABASE_GOOGLE_OAUTH_ENABLED=false
```

Storefront configuration:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_WHATSAPP_NUMBER=919999999999
NEXT_PUBLIC_GOOGLE_REVIEWS_URL=
```

Payments:

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Optional live content sources:

```env
NEXT_PUBLIC_FEATURABLE_WIDGET_ID=
INSTAGRAM_RSS_URL=
GOOGLE_PLACE_ID=
GOOGLE_MAPS_API_KEY=
INSTAGRAM_ACCESS_TOKEN=
```

Never commit real secrets. Keep production values in your hosting provider's environment settings.

If Google sign-in is needed, enable the Google provider in the Supabase dashboard and set NEXT_PUBLIC_SUPABASE_GOOGLE_OAUTH_ENABLED=true for that deployment.

## Database

Supabase migrations live in `supabase/migrations`.

Apply them in order to create the storefront tables, admin tables, order fields, category images, blog posts, tags, featured-post support, and the admin-managed Instagram reels table plus its thumbnail storage bucket.

## Project Structure

```text
src/
  app/                 App Router pages and API routes
  components/          Storefront, admin, product, cart, layout, and UI components
  context/             Cart, auth, and admin providers
  lib/                 API clients, config, Supabase mapping, content, utilities
  lib/constants/       Delivery and location data
supabase/migrations/   Database schema migrations
public/images/         Product, category, logo, reel, and hero assets
```

## Content Management

- Products, categories, tags, offers, posts, and orders are managed from `/admin`.
- Featured homepage product sections are controlled by featured tags.
- The lead blog article is controlled by the featured post toggle.
- Google reviews fall back to curated entries in `src/lib/google-reviews.ts`.
- Instagram reels fall back to local reel cover images in `public/images`.

## Deployment Checklist

1. Set all production environment variables.
2. Run the Supabase migrations.
3. Configure storage buckets used by product and category uploads.
4. Add Razorpay keys if online payment is enabled.
5. Set `NEXT_PUBLIC_SITE_URL` to the production domain.
6. Run `npm run build`.

## Notes

- The Next.js API routes are the server boundary for Supabase service-role access.
- Client-visible variables must use the `NEXT_PUBLIC_` prefix.
- Payment totals and coupon discounts are recalculated on the server.
- Generated folders such as `.next`, `node_modules`, and TypeScript build info should stay out of git.
