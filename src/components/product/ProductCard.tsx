"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ShoppingBag, MessageCircle, Check } from "lucide-react";
import type { Product } from "@/lib/types";
import { Rating } from "@/components/ui/Rating";
import { useCart } from "@/context/CartContext";
import {
  defaultVariant,
  priceRange,
  inStock,
  bestDiscountPct,
  toCartItem,
  variantLabel,
  prettifyTag,
} from "@/lib/product";
import { getProductImage } from "@/lib/images";
import { waLink, productEnquiryMessage } from "@/lib/whatsapp";
import { formatINR, cn } from "@/lib/utils";

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id || ""
  );

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    defaultVariant(product);

  const available = inStock(product);
  const discount = bestDiscountPct(product);
  const featureTag = (product.tags ?? [])[0];
  const href = `/product/${product.slug}`;

  function quickAdd() {
    add(toCartItem(product, activeVariant));
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-soft transition-shadow hover:shadow-card",
        className,
      )}
    >
      <Link href={href} className="relative block aspect-square overflow-hidden bg-cream-100">
        <Image
          src={getProductImage(product)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-maroon-800 px-2.5 py-1 text-xs font-bold text-cream-50">
              {discount}% OFF
            </span>
          )}
          {featureTag && (
            <span className="rounded-full bg-saffron-400 px-2.5 py-1 text-xs font-semibold text-maroon-900">
              {prettifyTag(featureTag)}
            </span>
          )}
        </div>

        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream-50/70">
            <span className="rounded-full bg-ink-900/80 px-4 py-1.5 text-sm font-semibold text-cream-50">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className="line-clamp-1 text-[11px] font-medium uppercase tracking-wide text-ink-400 sm:text-xs">
          {product.categoryLabel ?? " "}
        </span>
        <h3 className="mt-1 line-clamp-2 min-h-[2.4rem] font-serif text-sm font-semibold leading-snug text-maroon-900 sm:min-h-[2.75rem] sm:text-base">
          <Link href={href} className="transition-colors hover:text-saffron-600">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1.5">
          <Rating value={product.rating} count={product.reviewCount} />
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-bold text-maroon-900 sm:text-lg">
            {formatINR(activeVariant.price)}
          </span>
          {activeVariant.mrp && activeVariant.mrp > activeVariant.price && (
            <span className="text-sm text-ink-400 line-through">
              {formatINR(activeVariant.mrp)}
            </span>
          )}
        </div>

        {/* Weight variants selection (inline weight selector) */}
        {product.variants.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  v.id === selectedVariantId
                    ? "bg-ink-900 border-ink-900 text-white shadow-sm"
                    : "bg-white border-cream-200 text-ink-800 hover:bg-cream-50"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-3">
          <button
            type="button"
            onClick={quickAdd}
            disabled={!available}
            className={cn(
              "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              added
                ? "bg-leaf-600 text-white"
                : "bg-maroon-800 text-cream-50 hover:bg-maroon-700",
            )}
          >
            {added ? (
              <>
                <Check size={16} /> Added
              </>
            ) : (
              <>
                <ShoppingBag size={16} /> Add
              </>
            )}
          </button>

          <a
            href={waLink(
              productEnquiryMessage(
                product.name,
                variantLabel(activeVariant),
                activeVariant.price,
              ),
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Order ${product.name} on WhatsApp`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white transition-colors hover:bg-[#1fb457]"
          >
            <MessageCircle size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
