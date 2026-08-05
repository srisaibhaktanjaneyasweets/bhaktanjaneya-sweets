function readAdminToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem("bas_admin_session");
    if (!raw) return undefined;
    return (JSON.parse(raw) as { token?: string }).token;
  } catch {
    return undefined;
  }
}

async function optimizeImageClientSide(file: File, maxWidth = 1000, quality = 0.8): Promise<File> {
  // If it's not an image, return original
  if (!file.type.startsWith("image/")) return file;
  // If it's a GIF or SVG, don't try to draw on canvas (preserves animations/vector)
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if larger than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format for optimal size/quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new File from the blob, renaming extension to .webp
              const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              try {
                const newFile = new File([blob], newName, {
                  type: "image/webp",
                  lastModified: Date.now(),
                });
                resolve(newFile);
              } catch {
                // Fallback if browser doesn't support File constructor on blob
                const fallback = new Blob([blob], { type: "image/webp" }) as Blob & { name?: string };
                fallback.name = newName;
                resolve(fallback);
              }
            } else {
              resolve(file);
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export async function uploadCategoryImage(file: File): Promise<string> {
  const token = readAdminToken();
  if (!token) throw new Error("Please log in to the admin panel first.");

  // For category images, a max width of 300 is plenty since they are displayed at 126x126
  const optimizedFile = await optimizeImageClientSide(file, 300, 0.85);

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(optimizedFile);
  });

  const res = await fetch("/api/admin/upload/category-image", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: optimizedFile.name,
      contentType: optimizedFile.type,
      base64,
    }),
  });

  let data: { url?: string; error?: string; message?: string } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    // Ignore JSON parse errors; we'll fall back to status text.
  }

  if (!res.ok) {
    throw new Error(
      data.error ?? data.message ?? `Upload failed (HTTP ${res.status})`,
    );
  }
  if (!data.url) throw new Error("Upload failed: missing url");
  return data.url;
}

export async function uploadProductImage(file: File): Promise<string> {
  const token = readAdminToken();
  if (!token) throw new Error("Please log in to the admin panel first.");

  // For product images, 800px is sufficient for the product gallery
  const optimizedFile = await optimizeImageClientSide(file, 800, 0.85);

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(optimizedFile);
  });

  const res = await fetch("/api/admin/upload/product-image", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: optimizedFile.name,
      contentType: optimizedFile.type,
      base64,
    }),
  });

  let data: { url?: string; error?: string; message?: string } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    // Ignore JSON parse errors; we'll fall back to status text.
  }

  if (!res.ok) {
    throw new Error(
      data.error ?? data.message ?? `Upload failed (HTTP ${res.status})`,
    );
  }
  if (!data.url) throw new Error("Upload failed: missing url");
  return data.url;
}

