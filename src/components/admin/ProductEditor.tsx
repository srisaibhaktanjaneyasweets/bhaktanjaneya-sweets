"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Category, Product, Variant } from "@/lib/types";
import { defaultProductImage } from "@/lib/images";
import { uid, betterSlugify } from "@/lib/utils";
import { Field, inputClass, Toggle, Modal, AdminButton } from "./ui";

const TAGS: { value: string; label: string }[] = [
  { value: "best-seller", label: "Best Seller" },
  { value: "top-pick", label: "Top Pick" },
  { value: "combo", label: "Combo" },
  { value: "new", label: "New" },
];

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
    images: [""],
    variants: [{ id: uid("var"), label: "", price: 0, stock: 0 }],
    tags: [],
    rating: 4.7,
    reviewCount: 0,
    active: true,
    badges: [],
    taxRate: 0,
    extraCharges: 0,
  };
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
  const isNew = !product;
  const [draft, setDraft] = useState<Draft>(
    product
      ? {
          ...product,
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

  function save() {
    const name = draft.name.trim();
    if (!name) return setError("Product name is required.");
    const variants = draft.variants
      .map((v) => ({ ...v, label: v.label.trim() }))
      .filter((v) => v.label && v.price > 0);
    if (variants.length === 0)
      return setError("Add at least one variant with a label and price.");

    const images = draft.images.map((s) => s.trim()).filter(Boolean);
    const category = categories.find((c) => c.slug === draft.category);

    onSave({
      ...draft,
      name,
      slug: (draft.slug.trim() ? betterSlugify(draft.slug) : betterSlugify(name)),

      description: draft.description.trim(),
      categoryLabel: category?.name,
      images: images.length ? images : [defaultProductImage(draft.category)],
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
                  slug: isNew && !d.slug ? betterSlugify(name) : d.slug,

                }));
              }}
              placeholder="Kaju Patisa"
            />
          </Field>
          <Field label="Slug" hint="Used in the product URL.">
            <input
              className={inputClass}
              value={draft.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="kaju-patisa"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              className={inputClass}
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end pb-1">
            <Toggle
              checked={draft.active}
              onChange={(v) => set("active", v)}
              label={draft.active ? "Active (visible)" : "Hidden"}
            />
          </div>
        </div>

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
            Variants (size, price, stock)
          </p>
          <div className="space-y-2">
            {draft.variants.map((v, i) => (
              <div key={v.id} className="flex items-center gap-2">
                <input
                  className={`${inputClass} min-w-0 flex-1`}
                  value={v.label}
                  onChange={(e) => setVariant(i, { label: e.target.value })}
                  placeholder="250 g"
                />
                <input
                  className={`${inputClass} shrink-0 basis-24`}
                  type="number"
                  min={0}
                  value={v.price || ""}
                  onChange={(e) =>
                    setVariant(i, { price: Number(e.target.value) })
                  }
                  placeholder="₹ price"
                />
                <input
                  className={`${inputClass} shrink-0 basis-24`}
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
                <input
                  className={`${inputClass} shrink-0 basis-20`}
                  type="number"
                  min={0}
                  value={v.stock}
                  onChange={(e) =>
                    setVariant(i, { stock: Number(e.target.value) })
                  }
                  placeholder="stock"
                />
                <button
                  type="button"
                  aria-label="Remove variant"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      variants: d.variants.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-maroon-700/5 hover:text-maroon-700"
                >
                  <Trash2 size={16} />
                </button>
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
        <div>
          <p className="mb-2 text-xs font-semibold text-ink-600">
            Image URLs
          </p>
          <div className="space-y-2">
            {draft.images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={`${inputClass} flex-1`}
                  value={img}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      images: d.images.map((s, idx) =>
                        idx === i ? e.target.value : s,
                      ),
                    }))
                  }
                  placeholder="/images/products/example.jpg or https://…"
                />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      images: d.images.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-maroon-700/5 hover:text-maroon-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setDraft((d) => ({ ...d, images: [...d.images, ""] }))
            }
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-saffron-600 hover:text-saffron-500"
          >
            <Plus size={15} /> Add image
          </button>
        </div>

        {/* Tags + badges */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-600">Tags</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => {
                const on = draft.tags.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleTag(t.value)}
                    className={
                      on
                        ? "rounded-full bg-maroon-800 px-3 py-1.5 text-xs font-medium text-cream-50"
                        : "rounded-full border border-cream-300 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-cream-100"
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
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
          <Field label="GST rate (%)" hint="Applied to the selling price at checkout, e.g. 5 for 5%.">
            <input
              className={inputClass}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={draft.taxRate ?? 0}
              onChange={(e) => set("taxRate", Number(e.target.value))}
              placeholder="0"
            />
          </Field>
          <Field label="Extra charges (₹)" hint="Flat amount per unit (packaging, handling, etc.).">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={draft.extraCharges ?? 0}
              onChange={(e) => set("extraCharges", Number(e.target.value))}
              placeholder="0"
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
