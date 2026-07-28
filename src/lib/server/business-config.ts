import { supabaseAdmin, isConfigured } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import type { BusinessConfig, SocialMediaItem } from "@/context/BusinessConfigContext";

export async function getBusinessConfigServer(): Promise<BusinessConfig> {
  const defaultSocials: SocialMediaItem[] = [
    { id: "instagram", name: "Instagram", url: config.social.instagram },
    { id: "facebook", name: "Facebook", url: config.social.facebook },
    { id: "youtube", name: "YouTube", url: config.social.youtube },
  ];

  const defaultConf: BusinessConfig = {
    phone: config.contact.phone,
    email: config.contact.email,
    address: config.contact.address,
    socials: defaultSocials,
  };

  if (!isConfigured) return defaultConf;

  try {
    const { data: siteData } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "business_config")
      .maybeSingle();

    if (siteData?.value) {
      const v = siteData.value as any;
      return {
        phone: v.phone || config.contact.phone,
        email: v.email || config.contact.email,
        address: v.address || config.contact.address,
        socials: Array.isArray(v.socials) ? v.socials : defaultSocials,
      };
    }

    const { data: settingsData } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "business_config")
      .maybeSingle();

    if (settingsData?.value) {
      const v = settingsData.value as any;
      return {
        phone: v.phone || config.contact.phone,
        email: v.email || config.contact.email,
        address: v.address || config.contact.address,
        socials: Array.isArray(v.socials) ? v.socials : defaultSocials,
      };
    }
  } catch {}

  return defaultConf;
}
