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

  // Redirect the browser directly to the Supabase CDN url.
  // This bypasses the Vercel bandwidth limits and the binary corruption bug
  // while keeping backward compatibility for old URLs that were stored as proxy paths.
  return NextResponse.redirect(url, {
    status: 301,
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}
