"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { getProductImage } from "@/lib/images";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { AdminButton, EmptyState, inputClass } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";

export default function AdminProductsPage() {
  const { products, categories, saveProduct, deleteProduct } = useAdmin();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "all" ||
        p.category === selectedCategory ||
        (p.categories ?? []).includes(selectedCategory);

      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.categories ?? [p.category]).some((c) => c.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [products, query, selectedCategory]);

  function requestDelete(p: Product) {
    setConfirmId(p.id);
    setConfirmName(p.name);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!confirmId) return;
    const id = confirmId;
    setConfirmOpen(false);
    try {
      await deleteProduct(id);
      toast({
        tone: "success",
        title: "Product deleted",
        message: confirmName ? `Removed "${confirmName}".` : "Removed product.",
      });
    } catch (err) {
      toast({
        tone: "error",
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setConfirmId(null);
      setConfirmName(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900">
            Products
          </h1>
          <p className="text-sm text-ink-500">
            {products.length} item{products.length !== 1 ? "s" : ""} in your
            catalog
          </p>
        </div>
        <AdminButton onClick={() => setCreating(true)}>
          <Plus size={16} /> Add product
        </AdminButton>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className={`${inputClass} pl-9`}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className={`${inputClass} w-full sm:w-56 cursor-pointer font-medium`}
        >
          <option value="all">All Categories ({products.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={26} />}
          title="No products found"
          text={
            query
              ? "Try a different search."
              : "Add your first product to get started."
          }
        />
      ) : (
        <div className="md:overflow-hidden md:rounded-2xl md:border md:border-cream-200 md:bg-white">
          <div className="md:overflow-x-auto">
            <table className="admin-table w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price from</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filtered.map((p) => {
                  const minPrice = Math.min(...p.variants.map((v) => v.price));
                  const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                  return (
                    <tr key={p.id} className="hover:bg-cream-50">
                      <td className="px-4 py-3 min-w-0">
                        <div className="flex items-center gap-3 min-w-0 w-full">
                          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream-100">
                            <Image
                              src={getProductImage(p)}
                              alt={p.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-maroon-900">
                              {p.name}
                            </p>
                            <p className="truncate text-xs text-ink-400">
                              /{p.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td data-label="Category" className="px-4 py-3 capitalize text-ink-600">
                        {p.categoryLabel ?? p.category}
                      </td>
                      <td data-label="Price from" className="px-4 py-3 font-medium text-maroon-900">
                        {formatINR(minPrice)}
                      </td>
                      <td data-label="Stock" className="px-4 py-3">
                        <span
                          className={
                            stock === 0
                              ? "font-semibold text-maroon-700"
                              : stock <= 10
                                ? "font-semibold text-saffron-600"
                                : "text-ink-600"
                          }
                        >
                          {stock}
                        </span>
                      </td>
                      <td data-label="Status" className="px-4 py-3">
                        <Badge tone={p.active ? "leaf" : "muted"}>
                          {p.active ? "Active" : "Hidden"}
                        </Badge>
                      </td>
                      <td data-label="Actions" className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(p)}
                            aria-label={`Edit ${p.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-maroon-800"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(p)}
                            aria-label={`Delete ${p.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-maroon-700/5 hover:text-maroon-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(editing || creating) && (
        <ProductEditor
          product={editing}
          categories={categories}
          onSave={(p) => {
            saveProduct(p);
            setEditing(null);
            setCreating(false);
          }}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete product?"
        description={confirmName ? `Are you sure you want to delete "${confirmName}"?` : undefined}
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmId(null);
          setConfirmName(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

