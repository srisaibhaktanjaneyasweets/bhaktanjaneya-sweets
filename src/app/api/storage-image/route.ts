import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const ALLOWED_HOST_SUFFIXES = [".supabase.co"];

function isAllowedUrl(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  if (!ALLOWED_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))) return false;
  return url.pathname.startsWith("/storage/v1/object/public/");
}

function parseStorageObject(url: URL): { bucket: string; path: string } | null {
  const prefix = "/storage/v1/object/public/";
  if (!url.pathname.startsWith(prefix)) return null;

  const remainder = url.pathname.slice(prefix.length);
  const firstSlash = remainder.indexOf("/");
  if (firstSlash === -1) return null;

  const bucket = remainder.slice(0, firstSlash);
  const path = remainder.slice(firstSlash + 1);
  if (!bucket || !path) return null;
  return { bucket, path };
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return new NextResponse("Missing url", { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return new NextResponse("Forbidden host", { status: 403 });
  }

  try {
    const parsed = parseStorageObject(url);
    if (!parsed) {
      return new NextResponse("Invalid storage path", { status: 400 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(parsed.bucket)
      .download(parsed.path);

    if (error || !data) {
      return new NextResponse(error?.message ?? "Upstream media unavailable", { status: 502 });
    }

    const contentType = data.type || "application/octet-stream";
    if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
      return new NextResponse("Unsupported media type", { status: 415 });
    }

    const bytes = Buffer.from(await data.arrayBuffer());

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 502 });
  }
}