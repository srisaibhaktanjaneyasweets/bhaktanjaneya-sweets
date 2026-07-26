import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import {
  defaultOfferBannerSettings,
  normalizeOfferBannerSettings,
  OFFER_BANNER_ROW_KEY,
  OFFER_BANNER_TABLE,
  type OfferBannerSettings,
} from "@/lib/offer-banner";

export async function getOfferBannerSettingsServer(): Promise<OfferBannerSettings> {
  const base = defaultOfferBannerSettings();
  if (!isConfigured) return base;
  try {
    const { data, error } = await supabaseAdmin
      .from(OFFER_BANNER_TABLE)
      .select("messages")
      .eq("key", OFFER_BANNER_ROW_KEY)
      .maybeSingle();
    
    if (error) {
      return base;
    }
    
    if (data && typeof data.messages === "object") {
      return normalizeOfferBannerSettings(data.messages as Partial<OfferBannerSettings>);
    }
  } catch {
    // keep defaults
  }
  return base;
}
