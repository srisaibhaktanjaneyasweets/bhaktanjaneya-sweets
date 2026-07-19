"use client";

import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import type { Category, Product, Variant } from "@/lib/types";
import { defaultProductImage } from "@/lib/images";
import { uid, betterSlugify } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";
import { Field, inputClass, Toggle, Modal, AdminButton } from "./ui";
import { ProductImagesEditor } from "./ProductImagesEditor";

type Draft = Omit<Product, "variants" | "images"> & {
  variants: Variant[];
  images: string[];
};

function blankProduct(category: string): Draft {
  return {
    id: uid("prod"),
    slug: "",
    name: "",
    description: "",
    category,
    categories: category ? [category] : [],
    images: [""],
    variants: [{ id: uid("var"), label: "", price: 0, stock: 0 }],
    tags: [],
    rating: 4.7,
    reviewCount: 0,
    active: true,
    badges: [],
  };
}

function suggestedVariants(base: Variant) {
  const match = base.label.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(kg|g|gm|pcs?|pieces?)$/);
  if (!match || !base.price) return [];
  const amount = Number(match[1]);
  const unit = match[2];
  const isWeight = unit === "kg" || unit === "g" || unit === "gm";
  const grams = unit === "kg" ? amount * 1000 : amount;
  return [0.5, 0.25]
    .map((factor) => {
      const quantity = isWeight ? grams * factor : amount * factor;
      if (!Number.isInteger(quantity) || quantity <= 0) return null;
      const label = isWeight
        ? quantity >= 1000 && quantity % 1000 === 0 ? `${quantity / 1000} kg` : `${quantity} g`
        : `${quantity} pcs`;
      return {
        id: uid("var"), label, price: Math.round(base.price * factor), stock: base.stock,
        ...(base.mrp ? { mrp: Math.round(base.mrp * factor) } : {}),
        ...(base.pieces ? { pieces: Math.max(1, Math.round(base.pieces * factor)) } : {}),
      };
    })
    .filter((variant): variant is Variant => variant !== null);
}

export function ProductEditor({
  product,
  categories,
  onSave,
  onClose,
}: {
  product: Product | null;
  categories: Category[];
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const { tags: allTags } = useAdmin();
  const isNew = !product;
  const [draft, setDraft] = useState<Draft>(
    product
      ? {
          ...product,
          categories:
            product.category
              ? [product.category]
              : product.categories?.length
                ? [product.categories[0]]
                : [],
          images: product.images.length ? [...product.images] : [""],
          variants: product.variants.map((v) => ({ ...v })),
          badges: product.badges ? [...product.badges] : [],
        }
      : blankProduct(categories[0]?.slug ?? "sweets"),
  );
  const [error, setError] = useState("");

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setVariant(i: number, patch: Partial<Variant>) {
    setDraft((d) => ({
      ...d,
      variants: d.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    }));
  }

  function toggleTag(tag: string) {
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(tag)
        ? d.tags.filter((t) => t !== tag)
        : [...d.tags, tag],
    }));
  }

  function toggleCategory(slug: string) {
    setDraft((d) => ({
      ...d,
      categories: [slug],
    }));
  }

  function save() {
    const name = draft.name.trim();
    if (!name) return setError("Product name is required.");
    const variants = draft.variants
      .map((v) => {
        const pieces = Number(v.pieces);
        return {
          ...v,
          label: (v.label ?? "").trim(),
          pieces: Number.isFinite(pieces) && pieces > 0 ? pieces : undefined,
        };
      })
      .filter((v) => v.label && Number(v.price) > 0);

    if (variants.length === 0)
      return setError("Add at least one variant with a label and price.");

    const selectedCategories = draft.categories.filter(Boolean);
    if (selectedCategories.length === 0)
      return setError("Select at least one category.");

    const images = draft.images.map((s) => s.trim()).filter(Boolean);
    // The first selected category is the "primary" one — drives the breadcrumb,
    // default artwork, and the legacy single-category column.
    const primarySlug = selectedCategories[0];
    const primary = categories.find((c) => c.slug === primarySlug);

    onSave({
      ...draft,
      name,
      slug: betterSlugify(name),

      description: draft.description.trim(),
      category: primarySlug,
      categories: selectedCategories,
      categoryLabel: primary?.name,
      images: images.length ? images : [defaultProductImage(primarySlug)],
      variants,
      rating: Number(draft.rating) || 0,
      reviewCount: Number(draft.reviewCount) || 0,
      badges: (draft.badges ?? []).map((b) => b.trim()).filter(Boolean),
    });
  }

  return (
    <Modal
      wide
      title={isNew ? "Add product" : "Edit product"}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save}>
            {isNew ? "Create product" : "Save changes"}
          </AdminButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) => {
                const name = e.target.value;
                setDraft((d) => ({
                  ...d,
                  name,
                  slug: betterSlugify(name),
                }));
              }}
              placeholder="Kaju Patisa"
            />
          </Field>
          <Field label="Slug" hint="Generated from the product name for the URL.">
            <input
              className={`${inputClass} cursor-not-allowed bg-cream-100 text-ink-500`}
              value={draft.slug}
              readOnly
              placeholder="kaju-patisa"
            />
          </Field>
        </div>

        {/* Categories — multi-select with a primary picker */}
        <div className="rounded-xl border border-cream-200 bg-cream-50/50 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-ink-600">Category</p>
            <span className="text-[11px] text-ink-400">
              {draft.categories.length ? "1 selected" : "None selected"}
            </span>
          </div>
          <p className="mb-3 text-xs text-ink-400">
            Choose the category where this product should appear.
          </p>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const idx = draft.categories.indexOf(c.slug);
              const on = idx !== -1;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.slug)}
                  aria-pressed={on}
                  className={
                    on
                      ? "inline-flex items-center gap-1.5 rounded-full bg-maroon-800 px-3 py-1.5 text-xs font-medium text-cream-50 ring-2 ring-maroon-800/20"
                      : "inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-maroon-300 hover:bg-cream-100"
                  }
                >
                  {on ? <Check size={13} /> : <Plus size={13} />}
                  {c.name}
                </button>
              );
            })}
          </div>

        </div>

        <Toggle
          checked={draft.active}
          onChange={(v) => set("active", v)}
          label={draft.active ? "Active (visible)" : "Hidden"}
        />

        <Field label="Description">
          <textarea
            className={`${inputClass} h-auto py-2`}
            rows={3}
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Rich, melt-in-your-mouth cashew fudge made in pure ghee."
          />
        </Field>

        {/* Variants */}
        <div>
          <p className="mb-2 text-xs font-semibold text-ink-600">
            Variants (size, pieces, price, stock)
          </p>
          <p className="mb-2 text-xs text-ink-400">
            Set <span className="font-medium">Pcs</span> only for packs that
            contain a fixed number of items (e.g. Bobbatlu 250 g = 5 pcs). It
            shows as &ldquo;250 g · 5 pcs&rdquo;. Leave blank for items sold by
            weight.
          </p>
          <div className="space-y-3">
            {draft.variants.map((v, i) => (
              <div key={v.id}>
              <div
                key={v.id}
                className="rounded-xl border border-cream-200 p-3 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:border-0 sm:p-0"
              >
                <label className="mb-2 block sm:mb-0 sm:min-w-0 sm:flex-1 sm:basis-32">
                  <span className="mb-1 block text-[11px] font-medium text-ink-400 sm:hidden">
                    Size / label
                  </span>
                  <input
                    className={`${inputClass} w-full`}
                    value={v.label}
                    onChange={(e) => setVariant(i, { label: e.target.value })}
                    placeholder="250 g"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <label className="block sm:basis-20">
                    <span className="mb-1 block text-[11px] font-medium text-ink-400 sm:hidden">
                      Pieces
                    </span>
                    <input
                      className={`${inputClass} w-full`}
                      type="number"
                      min={0}
                      value={v.pieces ?? ""}
                      onChange={(e) =>
                        setVariant(i, {
                          pieces: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Pcs"
                    />
                  </label>
                  <label className="block sm:basis-24">
                    <span className="mb-1 block text-[11px] font-medium text-ink-400 sm:hidden">
                      Price (₹)
                    </span>
                    <input
                      className={`${inputClass} w-full`}
                      type="number"
                      min={0}
                      value={v.price || ""}
                      onChange={(e) =>
                        setVariant(i, { price: Number(e.target.value) })
                      }
                      placeholder="₹ price"
                    />
                  </label>
                  <label className="block sm:basis-24">
                    <span className="mb-1 block text-[11px] font-medium text-ink-400 sm:hidden">
                      MRP (₹)
                    </span>
                    <input
                      className={`${inputClass} w-full`}
                      type="number"
                      min={0}
                      value={v.mrp ?? ""}
                      onChange={(e) =>
                        setVariant(i, {
                          mrp: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="MRP"
                    />
                  </label>
                  <label className="block sm:basis-20">
                    <span className="mb-1 block text-[11px] font-medium text-ink-400 sm:hidden">
                      Stock
                    </span>
                    <input
                      className={`${inputClass} w-full`}
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) =>
                        setVariant(i, { stock: Number(e.target.value) })
                      }
                      placeholder="stock"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      variants: d.variants.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-maroon-700/20 text-sm font-medium text-maroon-700 hover:bg-maroon-700/5 sm:mt-0 sm:w-10 sm:shrink-0 sm:border-0 sm:text-ink-400 sm:hover:text-maroon-700"
                >
                  <Trash2 size={16} />
                  <span className="sm:hidden">Remove variant</span>
                </button>
              </div>
              {suggestedVariants(v).filter((suggestion) => !draft.variants.some((existing) => existing.label.toLowerCase() === suggestion.label.toLowerCase())).length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-ink-400">Suggested:</span>
                  {suggestedVariants(v)
                    .filter((suggestion) => !draft.variants.some((existing) => existing.label.toLowerCase() === suggestion.label.toLowerCase()))
                    .map((suggestion) => (
                      <button
                        key={suggestion.label}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, variants: [...d.variants, suggestion] }))}
                        className="rounded-full border border-gold-400/50 bg-gold-400/10 px-2.5 py-1 font-semibold text-maroon-800 hover:bg-gold-400/20"
                      >
                        + {suggestion.label} · ₹{suggestion.price}
                      </button>
                    ))}
                </div>
              ) : null}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                variants: [
                  ...d.variants,
                  { id: uid("var"), label: "", price: 0, stock: 0 },
                ],
              }))
            }
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-saffron-600 hover:text-saffron-500"
          >
            <Plus size={15} /> Add variant
          </button>
        </div>

        {/* Images */}
        <ProductImagesEditor
          images={draft.images}
          onChange={(images) => setDraft((d) => ({ ...d, images }))}
        />


        {/* Tags + badges */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-600">Tags</p>
            {allTags.length === 0 ? (
              <p className="text-xs text-ink-400">
                No tags yet. Create them in Categories &amp; Tags.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allTags.map((t) => {
                  const on = draft.tags.includes(t.slug);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.slug)}
                      className={
                        on
                          ? "rounded-full bg-maroon-800 px-3 py-1.5 text-xs font-medium text-cream-50"
                          : "rounded-full border border-cream-300 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-cream-100"
                      }
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Field label="Badges" hint="Comma-separated, e.g. Pure Ghee, 100% Veg">
            <input
              className={inputClass}
              value={(draft.badges ?? []).join(", ")}
              onChange={(e) =>
                set(
                  "badges",
                  e.target.value.split(",").map((s) => s.trimStart()),
                )
              }
              placeholder="Pure Ghee, 100% Veg"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rating (0–5)">
            <input
              className={inputClass}
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={draft.rating}
              onChange={(e) => set("rating", Number(e.target.value))}
            />
          </Field>
          <Field label="Review count">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={draft.reviewCount}
              onChange={(e) => set("reviewCount", Number(e.target.value))}
            />
          </Field>
        </div>

        {error && <p className="text-sm text-maroon-700">{error}</p>}
      </div>
    </Modal>
  );
}
