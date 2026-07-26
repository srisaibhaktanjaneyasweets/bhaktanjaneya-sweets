export interface OfferBannerSettings {
  badge: string;
  title: string;
  description: string;
  code: string;
  buttonText: string;
  buttonLink: string;
  visible: boolean;
}

export const OFFER_BANNER_TABLE = "site_settings";
export const OFFER_BANNER_ROW_KEY = "offer_banner";

export function defaultOfferBannerSettings(): OfferBannerSettings {
  return {
    badge: "Welcome offer",
    title: "10% off your first order",
    description: "Use code BAS10 on orders above ₹500. Plus free shipping over ₹700.",
    code: "BAS10",
    buttonText: "Shop now",
    buttonLink: "/shop",
    visible: true,
  };
}

export function normalizeOfferBannerSettings(
  raw: Partial<OfferBannerSettings> | null | undefined,
): OfferBannerSettings {
  const base = defaultOfferBannerSettings();
  if (!raw) return base;
  const pickStr = (v: unknown, fallback: string) =>
    typeof v === "string" ? v : fallback;
  const pickBool = (v: unknown, fallback: boolean) =>
    typeof v === "boolean" ? v : fallback;
  return {
    badge: pickStr(raw.badge, base.badge),
    title: pickStr(raw.title, base.title),
    description: pickStr(raw.description, base.description),
    code: pickStr(raw.code, base.code),
    buttonText: pickStr(raw.buttonText, base.buttonText),
    buttonLink: pickStr(raw.buttonLink, base.buttonLink),
    visible: pickBool(raw.visible, base.visible),
  };
}
