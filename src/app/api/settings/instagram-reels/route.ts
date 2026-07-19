import { NextResponse } from "next/server";
import { getManagedInstagramReelLinks } from "@/lib/managed-instagram-reels";

/** Public read endpoint for the admin editor's initial list. */
export async function GET() {
  const reels = await getManagedInstagramReelLinks();
  return NextResponse.json(reels, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
