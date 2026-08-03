import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST_SUFFIXES = [".supabase.co"];

function isAllowedUrl(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  if (!ALLOWED_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))) return false;
  return url.pathname.startsWith("/storage/v1/object/public/");
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
    const upstream = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BhaktanjaneyaSweets/1.0)",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8,video/*;q=0.7",
      },
      next: { revalidate: 86400 },
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!upstream.ok || !upstream.body || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
      return new NextResponse("Upstream media unavailable", { status: 502 });
    }

    return new NextResponse(upstream.body, {
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