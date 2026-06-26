import type { Category, Customer, Offer, Order, Post, Product, Tag, Variant } from "@/lib/types";
import { betterSlugify } from "@/lib/utils";

type Row = Record<string, unknown>;

function optionalStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/**
 * Normalize a raw size/label string to a clean unit label.
 *  "250grms" -> "250 g", "1000grms" -> "1 kg", "5pcs" -> "5 pieces".
 * Anything it doesn't recognize is returned trimmed, unchanged.
 */
function normalizeUnitLabel(raw: string): string {
  const trimmed = raw.trim();
  const low = trimmed.toLowerCase().replace(/\s+/g, "");
  const weight = low.match(/^(\d+)(grms|gms|gm|g|kg)$/);
  if (weight) {
    const n = Number(weight[1]);
    const unit = weight[2];
    if (unit === "kg") return `${n} kg`;
    if (n >= 1000 && n % 1000 === 0) return `${n / 1000} kg`;
    return `${n} g`;
  }
  const pieces = low.match(/^(\d+)(pieces|pcs|pc|piece)$/);
  if (pieces) return `${Number(pieces[1])} pieces`;
  return trimmed;
}

/**
 * Reconcile the stored variant shape with the frontend `Variant` type.
 * The catalog in Supabase stores `{ size, price, pieces }` with no `id`/`stock`,
 * so we map `size` -> `label`, normalize units, derive a stable id, and default
 * stock to available (stock isn't tracked in that data).
 */
function normalizeVariant(raw: unknown, index: number, slug: string): Variant {
  const v = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sourceLabel =
    (typeof v.label === "string" && v.label) ||
    (typeof v.size === "string" && v.size) ||
    (v.size != null ? String(v.size) : "");
  const label = normalizeUnitLabel(sourceLabel);

  const piecesNum = Number(v.pieces);
  const pieces = Number.isFinite(piecesNum) && piecesNum > 0 ? piecesNum : undefined;

  const mrpNum = Number(v.mrp);
  const mrp = Number.isFinite(mrpNum) && mrpNum > 0 ? mrpNum : undefined;

  // Stock isn't tracked in the imported catalog; treat missing as available.
  const stock = v.stock == null ? 99 : Number(v.stock) || 0;

  const id =
    (typeof v.id === "string" && v.id) ||
    `${slug}-${betterSlugify(label) || `v${index + 1}`}`;

  return {
    id,
    label,
    price: Number(v.price ?? 0) || 0,
    stock,
    ...(mrp !== undefined ? { mrp } : {}),
    ...(pieces !== undefined ? { pieces } : {}),
  };
}

export function productFromRow(row: Row): Product {
  const slug = (row.slug as string | undefined) ?? "variant";
  const rawVariants = Array.isArray(row.variants) ? row.variants : [];
  const category = (row.category as string | null | undefined) ?? "";
  // Prefer the multi-category array; fall back to the legacy single category so
  // rows not yet backfilled still surface in collections.
  const categories = optionalStringArray(row.categories);
  const resolvedCategories =
    categories.length > 0 ? categories : category ? [category] : [];
  return {
    ...(row as unknown as Product),
    category: category || resolvedCategories[0] || "",
    categories: resolvedCategories,
    categoryLabel: (row.category_label as string | null | undefined) ?? (row as unknown as Product).categoryLabel,
    images: optionalStringArray(row.images),
    variants: rawVariants.map((v, i) => normalizeVariant(v, i, slug)),
    tags: optionalStringArray(row.tags),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    active: row.active !== false,
    badges: optionalStringArray(row.badges),
  };
}

export function productToRow(product: Product): Row {
  const { categoryLabel, reviewCount, categories, category, ...rest } = product;
  // Keep the array as the source of truth and mirror its first entry into the
  // legacy single-category column so older code paths keep working.
  const list = Array.isArray(categories) && categories.length
    ? categories
    : category
      ? [category]
      : [];
  return {
    ...rest,
    category: list[0] ?? category ?? null,
    categories: list,
    category_label: categoryLabel ?? null,
    review_count: reviewCount,
  };
}

export function categoryFromRow(row: Row): Category {
  const { sort_order, ...rest } = row;
  return {
    ...(rest as unknown as Category),
    order: (sort_order as number | null | undefined) ?? undefined,
  };
}

export function categoryToRow(category: Category): Row {
  const { order, ...rest } = category;
  return {
    ...rest,
    sort_order: order ?? null,
  };
}

export function tagFromRow(row: Row): Tag {
  const { sort_order, ...rest } = row;
  return {
    ...(rest as unknown as Tag),
    featured: row.featured === true,
    order: (sort_order as number | null | undefined) ?? undefined,
  };
}

export function tagToRow(tag: Tag): Row {
  const { order, featured, ...rest } = tag;
  return {
    ...rest,
    featured: featured ?? false,
    sort_order: order ?? 99,
  };
}

export function offerFromRow(row: Row): Offer {
  const { min_subtotal, starts_at, ends_at, ...rest } = row;
  return {
    ...(rest as unknown as Offer),
    minSubtotal: (min_subtotal as number | null | undefined) ?? undefined,
    startsAt: (starts_at as string | null | undefined) ?? undefined,
    endsAt: (ends_at as string | null | undefined) ?? undefined,
  };
}

export function offerToRow(offer: Offer): Row {
  const { minSubtotal, startsAt, endsAt, ...rest } = offer;
  return {
    ...rest,
    min_subtotal: minSubtotal ?? null,
    starts_at: startsAt ?? null,
    ends_at: endsAt ?? null,
  };
}

export function orderFromRow(row: Row): Order {
  const {
    customer_phone,
    customer_name,
    customer_email,
    shipping_address,
    notes,
    payment_method,
    payment_status,
    razorpay_order_id,
    razorpay_payment_id,
    delivery_company,
    delivery_tracking_id,
    created_at,
    ...rest
  } = row;
  return {
    ...(rest as unknown as Order),
    customerPhone: customer_phone as string,
    customerName: (customer_name as string | null | undefined) ?? undefined,
    customerEmail: (customer_email as string | null | undefined) ?? undefined,
    shippingAddress: (shipping_address as Order["shippingAddress"]) ?? undefined,
    notes: (notes as string | null | undefined) ?? undefined,
    paymentMethod: (payment_method as Order["paymentMethod"]) ?? undefined,
    paymentStatus: payment_status as Order["paymentStatus"],
    razorpayOrderId: (razorpay_order_id as string | null | undefined) ?? undefined,
    razorpayPaymentId: (razorpay_payment_id as string | null | undefined) ?? undefined,
    deliveryCompany: (delivery_company as string | null | undefined) ?? undefined,
    deliveryTrackingId: (delivery_tracking_id as string | null | undefined) ?? undefined,
    createdAt: created_at as string,
  };
}

export function orderToRow(order: Partial<Order>): Row {
  const {
    customerPhone,
    customerName,
    customerEmail,
    shippingAddress,
    notes,
    paymentMethod,
    paymentStatus,
    razorpayOrderId,
    razorpayPaymentId,
    deliveryCompany,
    deliveryTrackingId,
    createdAt,
    ...rest
  } = order;
  return {
    ...rest,
    ...(customerPhone !== undefined ? { customer_phone: customerPhone } : {}),
    ...(customerName !== undefined ? { customer_name: customerName ?? null } : {}),
    ...(customerEmail !== undefined ? { customer_email: customerEmail ?? null } : {}),
    ...(shippingAddress !== undefined ? { shipping_address: shippingAddress ?? null } : {}),
    ...(notes !== undefined ? { notes: notes ?? null } : {}),
    ...(paymentMethod !== undefined ? { payment_method: paymentMethod ?? null } : {}),
    ...(paymentStatus !== undefined ? { payment_status: paymentStatus } : {}),
    ...(razorpayOrderId !== undefined ? { razorpay_order_id: razorpayOrderId ?? null } : {}),
    ...(razorpayPaymentId !== undefined ? { razorpay_payment_id: razorpayPaymentId ?? null } : {}),
    ...(deliveryCompany !== undefined ? { delivery_company: deliveryCompany ?? null } : {}),
    ...(deliveryTrackingId !== undefined ? { delivery_tracking_id: deliveryTrackingId ?? null } : {}),
    ...(createdAt !== undefined ? { created_at: createdAt } : {}),
  };
}

export function postFromRow(row: Row): Post {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    excerpt: (row.excerpt as string | null | undefined) ?? "",
    author: (row.author as string | null | undefined) ?? "",
    cover: (row.cover as string | null | undefined) ?? "",
    date: typeof row.date === "string" ? row.date.slice(0, 10) : "",
    readMinutes: Number(row.read_minutes ?? 0) || 3,
    content: Array.isArray(row.content)
      ? row.content.filter((p): p is string => typeof p === "string")
      : [],
    active: row.active !== false,
    featured: row.featured === true,
  };
}

export function postToRow(post: Partial<Post>): Row {
  const { readMinutes, content, ...rest } = post;
  const row = { ...rest } as Row;
  if (readMinutes !== undefined) row.read_minutes = readMinutes;
  if (content !== undefined) row.content = Array.isArray(content) ? content : [];
  return row;
}

export function customerFromRow(row: Row, ordersCount = 0): Customer {
  const { created_at, saved_address, ...rest } = row;
  return {
    ...(rest as unknown as Customer),
    savedAddress: (saved_address as Customer["savedAddress"]) ?? undefined,
    createdAt: created_at as string,
    ordersCount,
  };
}

export function customerToRow(customer: Partial<Customer>): Row {
  const { savedAddress, createdAt, ...rest } = customer;
  const row = { ...rest } as Row;
  delete row.ordersCount;

  return {
    ...row,
    ...(savedAddress !== undefined ? { saved_address: savedAddress ?? null } : {}),
    ...(createdAt !== undefined ? { created_at: createdAt } : {}),
  };
}
