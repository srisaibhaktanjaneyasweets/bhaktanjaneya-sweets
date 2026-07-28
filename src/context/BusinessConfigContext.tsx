"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { config } from "@/lib/config";

export interface SocialMediaItem {
  id: string;
  name: string;
  url: string;
}

export interface BusinessConfig {
  phone: string;
  email: string;
  address: string;
  socials: SocialMediaItem[];
}

interface BusinessConfigContextType {
  config: BusinessConfig;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultSocials: SocialMediaItem[] = [
  { id: "instagram", name: "Instagram", url: config.social.instagram },
  { id: "facebook", name: "Facebook", url: config.social.facebook },
  { id: "youtube", name: "YouTube", url: config.social.youtube },
];

const defaultBusinessConfig: BusinessConfig = {
  phone: config.contact.phone,
  email: config.contact.email,
  address: config.contact.address,
  socials: defaultSocials,
};

const BusinessConfigContext = createContext<BusinessConfigContextType>({
  config: defaultBusinessConfig,
  loading: false,
  refresh: async () => {},
});

export function BusinessConfigProvider({ children }: { children: React.ReactNode }) {
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>(defaultBusinessConfig);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/settings/business");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setBusinessConfig({
            phone: data.phone || config.contact.phone,
            email: data.email || config.contact.email,
            address: data.address || config.contact.address,
            socials: Array.isArray(data.socials) ? data.socials : defaultSocials,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch business config", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <BusinessConfigContext.Provider value={{ config: businessConfig, loading, refresh: fetchConfig }}>
      {children}
    </BusinessConfigContext.Provider>
  );
}

export function useBusinessConfig() {
  return useContext(BusinessConfigContext);
}
