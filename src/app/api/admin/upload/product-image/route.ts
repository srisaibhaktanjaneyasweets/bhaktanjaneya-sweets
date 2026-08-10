export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
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

export async function POST(req: Request) {
  try {
    await requireRole(req, "admin");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await req.json();
  const { filename, contentType: rawContentType, base64 } = body;

  if (!base64 || typeof base64 !== "string") {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  const fileType = rawContentType || "image/jpeg";
  if (!ALLOWED.has(fileType)) {
    return NextResponse.json(
      { error: "Use JPG, PNG, WebP, or GIF" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(base64, "base64");

  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
  }

  let uploadBuffer: Buffer | Uint8Array = buffer;
  let contentType = fileType;
  let ext = (filename || "").split(".").pop()?.toLowerCase() || "jpg";


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


