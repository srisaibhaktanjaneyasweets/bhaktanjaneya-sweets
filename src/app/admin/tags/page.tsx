"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag as TagIcon, Star } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import {
  AdminButton,
  EmptyState,
  Field,
  Modal,
  Toggle,
  inputClass,
} from "@/components/admin/ui";
import { uid, betterSlugify } from "@/lib/utils";
import { config } from "@/lib/config";
import type { Tag } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";

function TagEditor({
  tag,
  otherFeaturedCount,
  onSave,
  onClose,
}: {
  tag: Tag | null;
  otherFeaturedCount: number;
  onSave: (t: Tag) => void;
  onClose: () => void;
}) {
  const isNew = !tag;
  const [draft, setDraft] = useState<Tag>(
    tag ?? {
      id: uid("tag"),
      slug: "",
      name: "",
      featured: false,
      order: 0,
    },
  );
  const [error, setError] = useState("");
  const [slugEdited, setSlugEdited] = useState(!isNew && !!tag?.slug);

  const featuredLimitReached = otherFeaturedCount >= config.maxFeaturedTags;

  function toggleFeatured(next: boolean) {
    if (next && featuredLimitReached) {
      setError(
        `Only ${config.maxFeaturedTags} tags can be featured on the home page. Unfeature another tag first.`,
      );
      return;
    }
    setError("");
    setDraft((d) => ({ ...d, featured: next }));
  }

  function save() {
    const name = draft.name.trim();
    if (!name) return setError("Tag name is required.");
    if (draft.featured && featuredLimitReached) {
      return setError(
        `Only ${config.maxFeaturedTags} tags can be featured on the home page. Unfeature another tag first.`,
      );
    }
    onSave({
      ...draft,
      name,
      slug: draft.slug.trim() ? betterSlugify(draft.slug) : betterSlugify(name),
      featured: !!draft.featured,
      order: Number(draft.order) || 0,
    });
  }

  return (
    <Modal
      title={isNew ? "Add tag" : "Edit tag"}
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
        <Field label="Name" hint="Shown on product cards and section titles.">
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
            placeholder="Best Sellers"
          />
        </Field>

        <Field label="Slug" hint="Used in /shop?tag=… links.">
          <input
            className={inputClass}
            value={draft.slug}
            onChange={(e) => {
              setSlugEdited(true);
              setDraft((d) => ({ ...d, slug: e.target.value }));
            }}
            placeholder="best-seller"
          />
        </Field>

        <Field
          label="Feature on home page"
          hint={`Featured tags get their own carousel on the home page. Up to ${config.maxFeaturedTags} tags can be featured (${otherFeaturedCount + (draft.featured ? 1 : 0)}/${config.maxFeaturedTags} used).`}
        >
          <Toggle
            checked={!!draft.featured}
            onChange={toggleFeatured}
            label={draft.featured ? "Shown on home page" : "Hidden from home page"}
          />
        </Field>

        <Field
          label="Sort order"
          hint="Lower numbers appear first on the home page; higher numbers last."
        >
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

export default function AdminTagsPage() {
  const { tags, products, saveTag, deleteTag } = useAdmin();
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [creatingTag, setCreatingTag] = useState(false);
  const [tagConfirm, setTagConfirm] = useState<Tag | null>(null);

  async function confirmDeleteTag() {
    if (!tagConfirm) return;
    const { id } = tagConfirm;
    setTagConfirm(null);
    try {
      await deleteTag(id);
      toast({ tone: "success", title: "Tag deleted", message: "Your tag has been removed." });
    } catch (err) {
      toast({
        tone: "error",
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  const sortedTags = [...tags].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
  );

  const tagCount = (slug: string) =>
    products.filter((p) => (p.tags ?? []).includes(slug)).length;

  return (
    <div className="space-y-6">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-maroon-900">
              Tags
            </h1>
            <p className="text-sm text-ink-500">
              Merchandising labels like Best Sellers and Top Picks. Up to {config.maxFeaturedTags} featured tags get their own carousel on the home page, ordered by sort order (lowest first).
            </p>
          </div>

          <AdminButton onClick={() => setCreatingTag(true)}>
            <Plus size={16} /> Add tag
          </AdminButton>
        </div>

        {sortedTags.length === 0 ? (
          <EmptyState
            icon={<TagIcon size={26} />}
            title="No tags yet"
            text="Create tags such as Best Seller or Top Pick to highlight products."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedTags.map((t) => {
              const count = tagCount(t.slug);
              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-cream-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-1.5 font-serif text-lg font-semibold text-maroon-900">
                        {t.name}
                        {t.featured ? (
                          <Star
                            size={15}
                            className="fill-saffron-400 text-saffron-400"
                            aria-label="Featured on home page"
                          />
                        ) : null}
                      </h3>
                      <p className="text-xs text-ink-400">/{t.slug}</p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingTag(t)}
                        aria-label={`Edit ${t.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-maroon-800"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setTagConfirm(t)}
                        aria-label={`Delete ${t.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-maroon-700/5 hover:text-maroon-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs font-medium text-saffron-600">
                      {count} product{count !== 1 ? "s" : ""}
                    </p>
                    <span
                      className={
                        t.featured
                          ? "rounded-full bg-saffron-400/20 px-2 py-0.5 text-[11px] font-semibold text-maroon-800"
                          : "rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-medium text-ink-400"
                      }
                    >
                      {t.featured ? "On home page" : "Not featured"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {editingTag || creatingTag ? (
        <TagEditor
          tag={editingTag}
          otherFeaturedCount={
            tags.filter((t) => t.featured && t.id !== editingTag?.id).length
          }
          onSave={(t) => {
            saveTag(t);
            setEditingTag(null);
            setCreatingTag(false);
          }}
          onClose={() => {
            setEditingTag(null);
            setCreatingTag(false);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={!!tagConfirm}
        title="Delete tag?"
        description={
          tagConfirm
            ? tagCount(tagConfirm.slug) > 0
              ? `"${tagConfirm.name}" is on ${tagCount(tagConfirm.slug)} product(s). Delete anyway? Those products keep the tag slug until edited.`
              : `Delete "${tagConfirm.name}"?`
            : undefined
        }
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setTagConfirm(null)}
        onConfirm={() => void confirmDeleteTag()}
      />
    </div>
  );
}