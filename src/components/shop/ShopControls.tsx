"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const sorts = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export function ShopControls({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const activeCategory = params.get("category") ?? "";
  const activeTag = params.get("tag") ?? "";
  const activeSort = params.get("sort") ?? "featured";
  const [q, setQ] = useState(params.get("q") ?? "");

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasFilters =
    !!activeCategory || !!activeTag || !!params.get("q") || activeSort !== "featured";

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: q.trim() || null });
          }}
          className="relative"
        >
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sweets, namkeen…"
            className="h-12 w-full rounded-full border border-cream-300 bg-white pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40"
          />
        </form>

        {/* chips row + sort beside it */}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-nowrap sm:px-0 sm:pb-0">
              <button
                type="button"
                onClick={() => update({ category: null })}
                className={cn(
                  "h-10 shrink-0 snap-start whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors sm:h-9",
                  !activeCategory
                    ? "border-maroon-800 bg-maroon-800 text-cream-50"
                    : "border-cream-300 bg-white text-maroon-800 hover:border-maroon-800/40",
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => update({ category: c.slug })}
                  className={cn(
                    "h-10 shrink-0 snap-start whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors sm:h-9",
                    activeCategory === c.slug
                      ? "border-maroon-800 bg-maroon-800 text-cream-50"
                      : "border-cream-300 bg-white text-maroon-800 hover:border-maroon-800/40",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0">
            <label htmlFor="sort" className="sr-only">
              Sort
            </label>
            {/* Desktop: native select */}
            <select
              id="sort"
              aria-label="Sort"
              value={activeSort}
              onChange={(e) => update({ sort: e.target.value })}
              className="hidden h-10 w-40 rounded-full border border-maroon-800/25 bg-white px-3 text-sm font-semibold text-maroon-800 shadow-sm focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 sm:block sm:h-9 sm:w-40"
            >
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Mobile: icon-only button opens native select */}
            <div className="relative sm:hidden">
              <Button
                type="button"
                variant="outline"
                aria-label="Sort"
                className="flex h-10 w-10 items-center justify-center rounded-full border-maroon-800/30 bg-white p-0"
              >
                <SlidersHorizontal size={18} className="text-maroon-800" />
              </Button>

              <select
                aria-label="Sort"
                value={activeSort}
                onChange={(e) => update({ sort: e.target.value })}
                className="absolute inset-0 h-10 w-10 cursor-pointer opacity-0"
              >
                {sorts.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Clear filters row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                update({
                  q: null,
                  category: null,
                  tag: null,
                  sort: null,
                });
              }}
              className="inline-flex items-center gap-1 text-sm font-medium text-maroon-700 hover:text-saffron-600"
            >
              <X size={15} /> Clear filters
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
