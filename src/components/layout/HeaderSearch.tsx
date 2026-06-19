"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { getProductImage } from "@/lib/images";
import { priceRange } from "@/lib/product";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/lib/types";

// Fetch the catalogue once and share it across every search box instance.
let productCache: Product[] | null = null;

export function HeaderSearch({
  variant = "desktop",
  onNavigate,
  autoFocus,
  inlineResults = false,
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  autoFocus?: boolean;
  inlineResults?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[]>(productCache ?? []);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (productCache) return;
    let alive = true;
    apiGet<Product[]>("/products")
      .then((p) => {
        productCache = p;
        if (alive) setProducts(p);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    function onDocPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, []);

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const starts: Product[] = [];
    const includes: Product[] = [];
    for (const p of products) {
      const name = p.name.toLowerCase();
      if (name.startsWith(query)) starts.push(p);
      else if (
        name.includes(query) ||
        (p.categoryLabel ?? "").toLowerCase().includes(query)
      )
        includes.push(p);
    }
    return [...starts, ...includes].slice(0, 6);
  }, [q, products]);

  function go(href: string) {
    setOpen(false);
    setActive(-1);
    setQ("");
    onNavigate?.();
    router.push(href);
  }

  function submit() {
    const query = q.trim();
    go(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      if (open && active >= 0 && matches[active]) {
        e.preventDefault();
        go(`/product/${matches[active].slug}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div ref={rootRef} className={inlineResults ? "w-full" : "relative w-full"}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="relative shrink-0">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={
            variant === "desktop"
              ? "Search sweets, namkeen, gifts…"
              : "Search sweets…"
          }
          aria-label="Search products"
          className="h-11 w-full rounded-full border border-cream-300 bg-cream-100/60 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40"
        />
      </form>

      {open && q.trim() ? (
        <div
          className={
            inlineResults
              ? "absolute left-0 right-0 top-[4.25rem] bottom-0 z-50 bg-cream-50 flex flex-col border-t border-cream-200 mt-0"
              : "absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-card"
          }
        >
          {matches.length > 0 ? (
            <ul
              role="listbox"
              className={
                inlineResults
                  ? "divide-y divide-cream-200 overflow-y-auto flex-1 min-h-0"
                  : "max-h-[60vh] overflow-auto overscroll-contain py-1"
              }
            >
              {matches.map((p, i) => {
                const { min, hasRange } = priceRange(p);
                return (
                  <li key={p.id} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        go(`/product/${p.slug}`);
                      }}
                      className={
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors " +
                        (i === active
                          ? "bg-saffron-500/10"
                          : inlineResults
                            ? "bg-white hover:bg-cream-100"
                            : "hover:bg-cream-100")
                      }
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream-100">
                        <Image
                          src={getProductImage(p)}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-maroon-900">
                          {p.name}
                        </span>
                        {p.categoryLabel ? (
                          <span className="block truncate text-xs text-ink-400">
                            {p.categoryLabel}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-maroon-900">
                        {hasRange ? (
                          <span className="mr-0.5 text-[11px] font-normal text-ink-400">
                            from
                          </span>
                        ) : null}
                        {formatINR(min)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-ink-500 bg-white">
              No sweets match &ldquo;{q.trim()}&rdquo;.
            </p>
          )}

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              submit();
            }}
            className={
              "flex w-full items-center justify-between gap-2 border-t border-cream-200 px-4 py-2.5 text-sm font-semibold text-maroon-800 hover:bg-cream-100 " +
              (inlineResults ? "bg-white shrink-0" : "")
            }
          >
            See all results for &ldquo;{q.trim()}&rdquo;
            <ArrowRight size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
