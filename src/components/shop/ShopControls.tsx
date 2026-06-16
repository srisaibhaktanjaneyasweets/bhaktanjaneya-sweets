"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
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

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => update({ category: null })}
          className={cn(
            "h-11 rounded-full border px-4 text-sm font-medium transition-colors sm:h-9",
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
              "h-11 rounded-full border px-4 text-sm font-medium transition-colors sm:h-9",
              activeCategory === c.slug
                ? "border-maroon-800 bg-maroon-800 text-cream-50"
                : "border-cream-300 bg-white text-maroon-800 hover:border-maroon-800/40",
            )}
          >
            {c.name}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-ink-500">
            Sort
          </label>
          <select
            id="sort"
            value={activeSort}
            onChange={(e) => update({ sort: e.target.value })}
            className="h-11 rounded-full border border-cream-300 bg-white px-3 text-sm font-medium text-maroon-800 focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 sm:h-9"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push(pathname);
          }}
          className="inline-flex items-center gap-1 text-sm font-medium text-maroon-700 hover:text-saffron-600"
        >
          <X size={15} /> Clear filters
        </button>
      )}
    </div>
  );
}
