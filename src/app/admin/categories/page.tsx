"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { getCategoryImage } from "@/lib/images";
import { Plus, Pencil, Trash2, FolderTree, Upload } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { uploadCategoryImage } from "@/lib/api/upload";
import {
  AdminButton,
  EmptyState,
  Field,
  Modal,
  inputClass,
} from "@/components/admin/ui";
import { uid, betterSlugify } from "@/lib/utils";
import type { Category } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";

function CategoryEditor({
  category,
  onSave,
  onClose,
}: {
  category: Category | null;
  onSave: (c: Category) => void;
  onClose: () => void;
}) {
  const isNew = !category;
  const [draft, setDraft] = useState<Category>(
    category ?? {
      id: uid("cat"),
      slug: "",
      name: "",
      description: "",
      image: "",
      order: 0,
    },
  );
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(!isNew && !!category?.slug);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadCategoryImage(file);
      setDraft((d) => ({ ...d, image: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    const name = draft.name.trim();
    if (!name) return setError("Category name is required.");
    onSave({
      ...draft,
      name,
      slug: draft.slug.trim() ? betterSlugify(draft.slug) : betterSlugify(name),
      description: draft.description?.trim() || undefined,
      image: draft.image?.trim() || undefined,
      order: Number(draft.order) || 0,
    });
  }

  return (
    <Modal
      title={isNew ? "Add category" : "Edit category"}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save}>{isNew ? "Create" : "Save"}</AdminButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <input
            className={inputClass}
            value={draft.name}
            onChange={(e) => {
              const name = e.target.value;
              setDraft((d) => ({
                ...d,
                name,
                slug: slugEdited ? d.slug : betterSlugify(name),
              }));
            }}
            placeholder="Sweets"
          />
        </Field>

        <Field label="Slug" hint="Used in /collections/[slug].">
          <input
            className={inputClass}
            value={draft.slug}
            onChange={(e) => {
              setSlugEdited(true);
              setDraft((d) => ({ ...d, slug: e.target.value }));
            }}
            placeholder="sweets"
          />
        </Field>

        <Field label="Description">
          <textarea
            className={`${inputClass} h-auto py-2`}
            rows={2}
            value={draft.description ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
          />
        </Field>

        <Field
          label="Category image"
          hint="Shown in the circle nav below the header. JPG, PNG, or WebP up to 5 MB."
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-cream-300 bg-cream-50">
              {draft.image ? (
                <Image
                  src={draft.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs text-ink-400">
                  No image
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onImageSelected}
              />
              <AdminButton
                type="button"
                variant="ghost"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={16} />
                {uploading
                  ? "Uploading…"
                  : draft.image
                    ? "Replace image"
                    : "Upload image"}
              </AdminButton>

              {draft.image ? (
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, image: "" }))}
                  className="text-left text-xs text-ink-500 hover:text-maroon-700"
                >
                  Remove image
                </button>
              ) : null}
            </div>
          </div>
        </Field>

        <Field label="Sort order">
          <input
            className={inputClass}
            type="number"
            value={draft.order ?? 0}
            onChange={(e) =>
              setDraft((d) => ({ ...d, order: Number(e.target.value) }))
            }
          />
        </Field>

        {error ? <p className="text-sm text-maroon-700">{error}</p> : null}
      </div>
    </Modal>
  );
}

export default function AdminCategoriesPage() {
  const { categories, products, saveCategory, deleteCategory } = useAdmin();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState<string | undefined>(undefined);

  const categoryCount = (slug: string) =>
    products.filter((p) => (p.categories ?? [p.category]).includes(slug)).length;

  function requestDelete(c: Category) {
    const count = categoryCount(c.slug);

    setConfirmId(c.id);
    setConfirmTitle("Delete category?");
    setConfirmDescription(
      count > 0
        ? `"${c.name}" has ${count} product(s). Delete anyway? Those products will keep their category slug.`
        : `Delete "${c.name}"?`,
    );
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!confirmId) return;
    const id = confirmId;
    setConfirmOpen(false);

    try {
      await deleteCategory(id);
      toast({
        tone: "success",
        title: "Category deleted",
        message: "Your category has been removed.",
      });
    } catch (err) {
      toast({
        tone: "error",
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setConfirmId(null);
    }
  }

  const sorted = [...categories].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return (
    <div className="space-y-6">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-maroon-900">
              Categories
            </h1>
            <p className="text-sm text-ink-500">
              {categories.length} categor{categories.length !== 1 ? "ies" : "y"} — a product can belong to several.
            </p>
          </div>

          <AdminButton onClick={() => setCreating(true)}>
            <Plus size={16} /> Add category
          </AdminButton>
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            icon={<FolderTree size={26} />}
            title="No categories yet"
            text="Create a category to group your products."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((c) => {
              const count = categoryCount(c.slug);

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-cream-200 bg-white p-5"
                >
                  <div className="mb-4 flex justify-center">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full border border-cream-300 bg-cream-50">
                      <Image
                        src={getCategoryImage(c)}
                        alt={c.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg font-semibold text-maroon-900">
                        {c.name}
                      </h3>
                      <p className="text-xs text-ink-400">/{c.slug}</p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        aria-label={`Edit ${c.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-maroon-800"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => requestDelete(c)}
                        aria-label={`Delete ${c.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-maroon-700/5 hover:text-maroon-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {c.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-ink-500">
                      {c.description}
                    </p>
                  ) : null}

                  <p className="mt-3 text-xs font-medium text-saffron-600">
                    {count} product{count !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {editing || creating ? (
        <CategoryEditor
          category={editing}
          onSave={(c) => {
            saveCategory(c);
            setEditing(null);
            setCreating(false);
          }}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle || "Confirm"}
        description={confirmDescription}
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmId(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}