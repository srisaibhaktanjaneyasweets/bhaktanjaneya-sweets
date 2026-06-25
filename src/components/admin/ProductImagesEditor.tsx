"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";

import { AdminButton, Field, inputClass } from "./ui";

import { uploadProductImage } from "@/lib/api/upload";


function isVideo(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("data:video/")) return true;
  const cleanSrc = src.split(/[?#]/)[0].toLowerCase();
  return (
    cleanSrc.endsWith(".mp4") ||
    cleanSrc.endsWith(".webm") ||
    cleanSrc.endsWith(".ogg") ||
    cleanSrc.endsWith(".mov") ||
    cleanSrc.endsWith(".m4v")
  );
}

function normalizeImages(images: string[]) {
  // Ensure at least one empty slot for UX.
  const cleaned = (images ?? []).map((s) => s ?? "").filter((s) => typeof s === "string");
  return cleaned.length ? cleaned : [""];
}

export function ProductImagesEditor({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const value = normalizeImages(images);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadProductImage(file);

      onChange([...(value ?? []), url]);
    } finally {
      setUploading(false);
    }
  }

  function removeAt(i: number) {
    const next = value.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [""]);
  }

  function setAt(i: number, nextUrl: string) {
    onChange(value.map((u, idx) => (idx === i ? nextUrl : u)));
  }

  return (
    <Field
      label="Product images"
      hint="Upload images or videos (stored in Supabase storage)." 
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/quicktime"
            className="hidden"
            onChange={onFileSelected}
          />
          <AdminButton
            type="button"
            variant="ghost"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={16} />
            {uploading ? "Uploading…" : "Upload image/video"}
          </AdminButton>

          <AdminButton
            type="button"
            variant="ghost"
            onClick={() => onChange([...(value ?? []), ""])}
          >
            <Plus size={16} />
            Add slot
          </AdminButton>
        </div>

        <div className="space-y-2">
          {value.map((img, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-cream-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <input
                    className={inputClass}
                    value={img}
                    onChange={(e) => setAt(i, e.target.value)}
                    placeholder="(Uploaded URL will appear here)"
                  />
                </div>
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => removeAt(i)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-maroon-700/5 hover:text-maroon-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {img?.trim() ? (
                <div className="relative h-24 w-full overflow-hidden rounded-lg border border-cream-200 bg-cream-50 flex items-center justify-center">
                  {isVideo(img) ? (
                    <video src={img} controls className="h-full w-full object-cover" muted />
                  ) : (
                    <Image
                      src={img}
                      alt="Product image"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 240px"
                    />
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Field>
  );
}

