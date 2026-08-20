import { NextResponse } from "next/server";
import type { PincodeOffice } from "@/lib/api/pincode";

interface PostalPincodeResponse {
  Status?: string;
  Message?: string;
  PostOffice?: Array<{
    Name?: string;
    District?: string;
    State?: string;
    Country?: string;
    Block?: string;
    Region?: string;
    Division?: string;
    DeliveryStatus?: string;
  }> | null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pincode: string }> | { pincode: string } },
) {
  const { pincode } = await params;
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit PIN code" }, { status: 400 });
  }

  const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "PIN lookup is unavailable right now" }, { status: 502 });
  }

  const payload = (await response.json()) as PostalPincodeResponse[];
  const result = payload[0];
  const offices = result?.PostOffice ?? [];
  if (result?.Status !== "Success" || offices.length === 0) {
    return NextResponse.json({ error: "No India Post details found for this PIN code" }, { status: 404 });
  }

  const sortedOffices = [...offices].sort((a, b) => {
    const aDelivery = a.DeliveryStatus === "Delivery" ? 0 : 1;
    const bDelivery = b.DeliveryStatus === "Delivery" ? 0 : 1;
    return aDelivery - bDelivery || (a.Name ?? "").localeCompare(b.Name ?? "");
  });
  const first = sortedOffices[0];
  const district = (first.District ?? "").trim();
  const city = district || (first.Division ?? "").trim() || (first.Region ?? "").trim() || "";

  return NextResponse.json({
    pincode,
    city,
    state: first.State ?? "",
    district,
    postOffices: sortedOffices.map((office) => ({
      name: office.Name ?? "",
      district: office.District ?? "",
      city: (office.District ?? "").trim() || (office.Division ?? "").trim() || (office.Region ?? "").trim() || "",
      state: office.State ?? "",
    })) satisfies PincodeOffice[],
  });
}
