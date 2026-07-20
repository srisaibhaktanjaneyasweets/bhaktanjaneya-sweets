"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Truck,
  ChevronDown,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatINR, cn } from "@/lib/utils";
import { defaultProductImage, getProductImage } from "@/lib/images";
import { apiGet } from "@/lib/api/client";
import { defaultVariant, toCartItem, priceRange } from "@/lib/product";
import { recommendForBasket } from "@/lib/recommend";
import type { Product } from "@/lib/types";

import {
  DEFAULT_SHIPPING_SETTINGS,
  getFreeShippingRemaining,
  checkMinOrderRequirement,
  type ShippingSettings,
} from "@/lib/shipping";

// Fetch the catalogue once and share it across opens.
let productCache: Product[] | null = null;
let shippingCache: ShippingSettings | null = null;

export function CartDrawer() {
  const {
    items,
    count,
    subtotal,
    setQty,
    remove,
    add,
    isOpen,
    setOpen,
    notes,
    setNotes,
  } = useCart();

  const [products, setProducts] = useState<Product[]>(productCache ?? []);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(
    shippingCache ?? DEFAULT_SHIPPING_SETTINGS,
  );
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Load products & shipping settings the first time the drawer opens.
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;

    if (!productCache) {
      apiGet<Product[]>("/products")
        .then((p) => {
          productCache = p;
          if (alive) setProducts(p);
        })
        .catch(() => {});
    }

    if (!shippingCache) {
      apiGet<ShippingSettings>("/settings/shipping")
        .then((s) => {
          if (s) {
            shippingCache = s;
            if (alive) setShippingSettings(s);
          }
        })
        .catch(() => {});
    }

    return () => {
      alive = false;
    };
  }, [isOpen]);

  const remaining = getFreeShippingRemaining(subtotal, shippingSettings);
  const progress = Math.min(
    100,
    (subtotal / (shippingSettings.freeShippingThreshold || 1)) * 100,
  );
  const minOrderCheck = checkMinOrderRequirement(subtotal, shippingSettings);

  // Basket-aware recommendations: rank the catalogue by similarity to what's
  // already in the cart (falls back to best-rated when the cart is empty).
  const recommendations = recommendForBasket(
    items.map((i) => i.productId),
    products,
    6,
  );

  function addRecommendation(p: Product) {
    add(toCartItem(p, defaultVariant(p)));
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!isOpen}
      inert={!isOpen ? true : undefined}
    >
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "absolute inset-0 bg-ink-900/50 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Panel */}
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream-50 shadow-card transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-maroon-900">
            Your Cart{count > 0 && ` (${count})`}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="flex h-11 w-11 items-center justify-center rounded-full text-maroon-800 hover:bg-maroon-800/5"
          >
            <X size={20} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-maroon-800">
              <ShoppingBag size={28} />
            </span>
            <div>
              <p className="font-serif text-lg font-semibold text-maroon-900">
                Your cart is empty
              </p>
              <p className="mt-1 text-sm text-ink-500">
                Add some sweets to get started.
              </p>
            </div>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center rounded-full bg-maroon-800 px-6 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!minOrderCheck.satisfied && (
                <div className="mb-3 rounded-xl border border-maroon-800/20 bg-maroon-800/10 p-3 text-xs font-medium text-maroon-900">
                  Minimum order value is <strong>{formatINR(shippingSettings.minOrderValue)}</strong>. Add <strong>{formatINR(minOrderCheck.remaining)}</strong> more to checkout.
                </div>
              )}
              {/* Free shipping progress */}
              <div className="mb-4 rounded-xl bg-cream-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  {remaining > 0 ? (
                    <p className="text-xs text-ink-600">
                      Add{" "}
                      <span className="font-semibold text-maroon-800">
                        {formatINR(remaining)}
                      </span>{" "}
                      more for free shipping
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-leaf-600">
                      🎉 You&apos;ve unlocked free shipping!
                    </p>
                  )}
                  <Truck
                    size={16}
                    className={cn(
                      "shrink-0",
                      remaining > 0 ? "text-ink-400" : "text-leaf-600",
                    )}
                  />
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-300">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      remaining > 0 ? "bg-saffron-500" : "bg-leaf-500",
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <ul className="space-y-4">
                {items.map((it) => (
                  <li key={it.variantId} className="flex gap-3">
                    <Link
                      href={`/product/${it.slug}`}
                      onClick={() => setOpen(false)}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-cream-200 bg-cream-100"
                    >
                      <Image
                        src={it.image || defaultProductImage("sweets")}
                        alt={it.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <Link
                          href={`/product/${it.slug}`}
                          onClick={() => setOpen(false)}
                          className="font-medium leading-snug text-maroon-900 hover:text-saffron-600"
                        >
                          {it.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(it.variantId)}
                          aria-label="Remove item"
                          className="text-ink-400 hover:text-maroon-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-ink-400">{it.variantLabel}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-cream-300 bg-white">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => setQty(it.variantId, it.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center text-maroon-800 hover:bg-maroon-800/5"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => setQty(it.variantId, it.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center text-maroon-800 hover:bg-maroon-800/5"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-semibold text-maroon-900">
                          {formatINR(it.price * it.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Customers also like */}
              {recommendations.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2.5 font-serif text-sm font-bold text-maroon-900">
                    Customers also like
                  </p>
                  <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                    {recommendations.map((p) => {
                      const { min, hasRange } = priceRange(p);
                      return (
                        <div
                          key={p.id}
                          className="flex w-36 shrink-0 flex-col rounded-xl border border-cream-200 bg-white p-2"
                        >
                          <Link
                            href={`/product/${p.slug}`}
                            onClick={() => setOpen(false)}
                            className="relative aspect-square overflow-hidden rounded-lg bg-cream-100"
                          >
                            <Image
                              src={getProductImage(p)}
                              alt={p.name}
                              fill
                              sizes="144px"
                              className="object-cover"
                            />
                          </Link>
                          <p className="mt-2 line-clamp-1 text-xs font-medium text-maroon-900">
                            {p.name}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-500">
                            {hasRange ? "from " : ""}
                            {formatINR(min)}
                          </p>
                          <button
                            type="button"
                            onClick={() => addRecommendation(p)}
                            className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-full bg-maroon-800 text-xs font-semibold text-cream-50 hover:bg-maroon-700"
                          >
                            <Plus size={13} /> Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add order notes */}
              <div className="mt-6 overflow-hidden rounded-xl border border-cream-200">
                <button
                  type="button"
                  onClick={() => setNotesOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-maroon-900"
                >
                  <span>
                    Add order notes
                    {notes.trim() ? (
                      <span className="ml-2 rounded-full bg-saffron-500/20 px-2 py-0.5 text-[10px] font-semibold text-saffron-700">
                        Added
                      </span>
                    ) : null}
                  </span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "shrink-0 text-ink-400 transition-transform",
                      notesOpen && "rotate-180",
                    )}
                  />
                </button>
                {notesOpen && (
                  <div className="px-4 pb-3">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Preferred delivery time, gift message, etc."
                      className="w-full resize-none rounded-lg border border-cream-300 bg-white p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/30"
                    />
                  </div>
                )}
              </div>
            </div>

            <footer className="border-t border-cream-200 px-5 py-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-ink-600">Subtotal</span>
                <span className="text-lg font-bold text-maroon-900">
                  {formatINR(subtotal)}
                </span>
              </div>
              <p className="mb-3 text-xs text-ink-400">
                Taxes included. Shipping &amp; offers calculated at checkout.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="flex h-12 w-full items-center justify-center rounded-full border border-maroon-800/30 text-sm font-semibold text-maroon-800 hover:bg-maroon-800/5"
                >
                  View cart
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-maroon-800 text-sm font-semibold text-cream-50 hover:bg-maroon-700"
                >
                  Checkout
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
