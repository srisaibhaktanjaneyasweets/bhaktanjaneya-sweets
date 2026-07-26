import { NextResponse } from "next/server";
import { getOfferBannerSettingsServer } from "@/lib/api/offer-banner";

export async function GET() {
  const settings = await getOfferBannerSettingsServer();
  return NextResponse.json(
    { settings },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60" } },
  );
}
