import type { ShippingAddress } from "@/lib/types";

export function isCompleteAddress(address?: ShippingAddress | null): boolean {
  if (!address) return false;
  return (
    !!address.line1?.trim() &&
    !!address.city?.trim() &&
    !!address.state?.trim() &&
    /^\d{6}$/.test(address.pincode?.trim() ?? "")
  );
}

export function formatAddressLines(address: ShippingAddress): string[] {
  const locality = [address.area, address.district, address.city].filter(Boolean).join(", ");
  return [
    address.line1,
    address.line2?.trim() || undefined,
    locality || undefined,
    `${address.state} ${address.pincode}`.trim(),
  ].filter((line): line is string => !!line?.trim());
}

export function formatAddressSingle(address: ShippingAddress): string {
  return formatAddressLines(address).join(", ");
}
