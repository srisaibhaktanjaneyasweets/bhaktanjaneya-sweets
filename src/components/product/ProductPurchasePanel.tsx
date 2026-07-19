"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Zap, Check } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { toCartItem, variantLabel } from "@/lib/product";
import { formatINR, cn, discountPct } from "@/lib/utils";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const { add, setOpen } = useCart();
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const sorted = [...variants].sort((a, b) => a.price - b.price);
  const [variantId, setVariantId] = useState(sorted[0]?.id ?? "");

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = (variants.find((v) => v.id === variantId) ?? sorted[0]) ?? {
    id: "",
    label: "",
    price: 0,
    stock: 0,
  };
  const pct = discountPct(variant.price, variant.mrp);
  const out = (variant.stock ?? 0) <= 0;


  function addToCart() {
    if (out) return;
    add(toCartItem(product, variant, qty));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function buyNow() {
    if (out) return;
    add(toCartItem(product, variant, qty));
    setOpen(false);
    router.push("/cart");
  }

  const stepBtn =
    "flex h-10 w-10 items-center justify-center text-maroon-800 transition-colors hover:bg-maroon-800/5 disabled:opacity-40";

  return (
    <div className="mt-6">
      {/* Price */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold text-maroon-900">
          {formatINR(variant.price)}
        </span>
        {variant.mrp && variant.mrp > variant.price && (
          <>
            <span className="text-lg text-ink-400 line-through">
              {formatINR(variant.mrp)}
            </span>
            <span className="rounded-full bg-leaf-600/12 px-2 py-0.5 text-sm font-semibold text-leaf-600">
              {pct}% off
            </span>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-400">Inclusive of all taxes</p>

      {/* Variants */}
      {sorted.length > 1 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-maroon-900">
            Select size
          </p>
          <div className="flex flex-wrap gap-2">
            {sorted.map((v, i) => {
              const sel = v.id === variantId;
              const vo = v.stock <= 0;
              return (
                <button
                  key={v.id || `${v.label}-${i}`}
                  type="button"
                  disabled={vo}
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    sel
                      ? "border-maroon-800 bg-maroon-800 text-cream-50"
                      : "border-cream-300 bg-white text-maroon-800 hover:border-maroon-800/40",
                  )}
                >
                  <span className="block text-sm font-medium">
                    {variantLabel(v)}
                  </span>
                  <span
                    className={cn(
                      "block text-xs",
                      sel ? "text-cream-100/80" : "text-ink-400",
                    )}
                  >
                    {formatINR(v.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {sorted.length === 1 && (
        <p className="mt-5 text-sm text-ink-500">
          Size: <span className="font-semibold text-maroon-900">{variantLabel(variant)}</span>
        </p>
      )}

      {/* Quantity + stock */}
      <div className="mt-5 flex items-center gap-4">
        <div className="inline-flex items-center rounded-full border border-cream-300 bg-white">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className={cn(stepBtn, "rounded-l-full")}
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center text-sm font-semibold text-maroon-900">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(variant.stock || 99, q + 1))}
            disabled={out || qty >= (variant.stock || 99)}
            className={cn(stepBtn, "rounded-r-full")}
          >
            <Plus size={16} />
          </button>
        </div>

        {out ? (
          <span className="text-sm font-medium text-maroon-700">
            Out of stock
          </span>
        ) : variant.stock <= 10 ? (
          <span className="text-sm font-medium text-saffron-600">
            Only {variant.stock} left
          </span>
        ) : (
          <span className="text-sm font-medium text-leaf-600">In stock</span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          disabled={out}
          onClick={addToCart}
          className={cn(
            "inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full text-base font-semibold shadow-soft transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            added
              ? "bg-leaf-600 text-white"
              : "bg-maroon-800 text-cream-50 hover:bg-maroon-700",
          )}
        >
          {added ? (
            <>
              <Check size={20} /> Added to cart
            </>
          ) : (
            <>
              <ShoppingBag size={20} /> Add to cart
            </>
          )}
        </button>
        <button
          type="button"
          disabled={out}
          onClick={buyNow}
          className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-saffron-500 text-base font-semibold text-maroon-900 shadow-soft transition-colors hover:bg-saffron-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Zap size={20} /> Buy now
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-maroon-700 transition-colors hover:text-saffron-600"
      >
        View cart →
      </button>
    </div>
  );
}
