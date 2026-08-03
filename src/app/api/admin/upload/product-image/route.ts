import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { optimizeUploadedImage } from "@/lib/server/image-optimizer";
import { proxyStorageImage } from "@/lib/images";

const BUCKET = "product-images2";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

async function getFileBuffer(file: File): Promise<Buffer> {
  if (typeof (file as any).bytes === "function") {
    return Buffer.from(await (file as any).bytes());
  }
  try {
    const reader = file.stream().getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return Buffer.from(result.buffer);
  } catch (err) {
    console.warn("Stream read failed, falling back to arrayBuffer:", err);
    return Buffer.from(await file.arrayBuffer());
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use JPG, PNG, WebP, or GIF" },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
  }

  const buffer = await getFileBuffer(file);

  let uploadBuffer: any = buffer;
  let contentType = file.type;
  let ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

  if (file.type.startsWith("image/")) {
    try {
      const optimized = await optimizeUploadedImage(buffer, file.type);
      uploadBuffer = optimized.buffer;
      contentType = optimized.contentType;
      ext = optimized.ext;
    } catch (optError) {
      console.error("Fallback upload used:", optError);
      ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    }
  }

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, uploadBuffer, { contentType, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: proxyStorageImage(data.publicUrl) });
}

