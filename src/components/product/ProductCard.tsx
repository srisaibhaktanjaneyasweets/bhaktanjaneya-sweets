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
        "group flex h-full flex-col overflow-hidden rounded-md border border-cream-200 bg-white shadow-soft transition duration-300 hover:border-gold-400/60 hover:shadow-card",
        className,
      )}
    >
      <Link href={href} className="relative block aspect-square overflow-hidden bg-cream-100">
        <Image
          src={getProductImage(product)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1">
          {discount > 0 && (
            <span className="rounded-md bg-maroon-800 px-2 py-0.5 text-[11px] font-bold text-cream-50 shadow-sm">
              {discount}% OFF
            </span>
          )}
          {featureTag && (
            <span className="rounded-md bg-gold-500 px-2 py-0.5 text-[11px] font-semibold text-maroon-900 shadow-sm">
              {prettifyTag(featureTag)}
            </span>
          )}
        </div>

        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream-50/70">
            <span className="rounded-md bg-ink-900/80 px-4 py-1.5 text-sm font-semibold text-cream-50">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <span className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-ink-700 sm:text-[11px]">
          {product.categoryLabel ?? " "}
        </span>
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.1rem] font-serif text-sm font-medium leading-snug text-maroon-900 sm:min-h-[2.3rem] sm:text-[15px]">
          <Link href={href} className="transition-colors hover:text-maroon-700">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1">
          <Rating value={product.rating} count={product.reviewCount} />
        </div>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-semibold text-maroon-900 sm:text-base">
            {formatINR(activeVariant.price)}
          </span>
          {activeVariant.mrp && activeVariant.mrp > activeVariant.price && (
            <span className="text-xs text-ink-400 line-through">
              {formatINR(activeVariant.mrp)}
            </span>
          )}
        </div>

        {/* Weight variants (real weights from product data). The row always
            reserves its height — even for single-variant products — so cards
            never render shorter than their neighbours. */}
        <div className="mt-2 flex min-h-[1.625rem] flex-wrap gap-1">
          {product.variants.length === 1 && (
            <span className="rounded-full border border-cream-300 bg-cream-50 px-2.5 py-0.5 text-[11px] font-medium text-ink-600">
              {variantLabel(activeVariant)}
            </span>
          )}
          {product.variants.length > 1 &&
            product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                  v.id === selectedVariantId
                    ? "border-maroon-800 bg-maroon-800 text-cream-50"
                    : "border-cream-300 bg-white text-ink-600 hover:border-maroon-800/40 hover:text-maroon-900"
                )}
              >
                {variantLabel(v)}
              </button>
            ))}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-2.5">
          <button
            type="button"
            onClick={quickAdd}
            disabled={!available}
            className={cn(
              "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap shadow-soft transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
              added
                ? "bg-leaf-600 text-white"
                : "bg-maroon-800 text-cream-50 hover:bg-maroon-700",
            )}
          >
            {added ? (
              <>
                <Check size={15} /> Added
              </>
            ) : (
              <>
                <ShoppingBag size={15} /> Add to cart
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
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#35B664] text-white shadow-soft transition-colors hover:bg-[#2E9E57]"
          >
            <MessageCircle size={17} />
          </a>
        </div>
      </div>
    </div>
  );
}
