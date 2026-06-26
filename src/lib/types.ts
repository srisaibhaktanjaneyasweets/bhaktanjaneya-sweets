// Shared domain types used across the storefront, admin panel, and API routes.

export interface Variant {
  /** Unique within a product, used as the cart/order line key. */
  id: string;
  /** Human label, e.g. "250 g", "1 kg", "12 pieces". */
  label: string;
  /** Current selling price in INR (rupees, integer). */
  price: number;
  /** Optional original price for strike-through / discount display. */
  mrp?: number;
  /** Units in stock. */
  stock: number;
  /**
   * Optional piece count for packs sold by weight that also contain a fixed
   * number of items (e.g. Bobbatlu "250 g" = 5 pcs). Shown next to the label
   * as "250 g · 5 pcs". Omit for products measured purely by weight.
   */
  pieces?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  /**
   * Primary category slug, e.g. "sweets" | "namkeen". Kept for breadcrumbs,
   * default artwork, and backward compatibility — mirrors `categories[0]`.
   */
  category: string;
  /** All category slugs this product belongs to. A product can live in many. */
  categories: string[];
  categoryLabel?: string;
  /** Image URLs. Placeholders today; real photos uploaded via admin later. */
  images: string[];
  variants: Variant[];
  /** Merchandising flags: "best-seller" | "top-pick" | "combo" | "new". */
  tags: string[];
  rating: number;
  reviewCount: number;
  active: boolean;
  /** Short trust badges, e.g. "100% Pure Veg", "Pure Ghee". */
  badges?: string[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  order?: number;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  /** When true, the tag gets its own carousel on the home page. */
  featured?: boolean;
  order?: number;
}

export type OfferType = "percent" | "flat" | "free_shipping";

export interface Offer {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: OfferType;
  /** Percent (0-100) or flat amount in INR; ignored for free_shipping. */
  value: number;
  /** Minimum cart subtotal for the offer to apply. */
  minSubtotal?: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image?: string;
  variantId: string;
  variantLabel: string;
  price: number;
  quantity: number;
}

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  savedAddress?: ShippingAddress;
  createdAt: string;
  ordersCount?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  variantLabel: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  district?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface DeliveryTracking {
  company?: string;
  trackingId?: string;
}

export type PaymentMethod = "razorpay" | "cod";
export type OrderChannel = "online";
export type PaymentStatus = "pending" | "paid" | "failed" | "cod";
export type OrderStatus =
  | "new"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: ShippingAddress;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
  channel: OrderChannel;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  deliveryCompany?: string;
  deliveryTrackingId?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Post {
  id: string;
  /** URL key, unique. */
  slug: string;
  title: string;
  /** Short summary shown on cards and meta description. */
  excerpt: string;
  author: string;
  /** Cover image URL. */
  cover: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** Estimated read time in minutes. */
  readMinutes: number;
  /** Body paragraphs, in order. */
  content: string[];
  /** Hidden from the storefront when false. */
  active: boolean;
  /** When true, this post is the large lead article on the home page. */
  featured?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: "admin";
}

export interface Session {
  token: string;
  customer?: Customer;
}
