-- Migration: 20260720_shipping_delivery_settings.sql
-- Description: Safely adds missing columns and default shipping configuration to Supabase tables.

-- 1. Ensure site_settings and settings tables exist
CREATE TABLE IF NOT EXISTS public.site_settings (
    key text PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY
);

-- 2. Safely add missing columns to site_settings and settings if they don't exist
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS value jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS messages jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS value jsonb;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. Create public read policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Allow public read access to site_settings'
    ) THEN
        CREATE POLICY "Allow public read access to site_settings"
            ON public.site_settings FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Allow public read access to settings'
    ) THEN
        CREATE POLICY "Allow public read access to settings"
            ON public.settings FOR SELECT USING (true);
    END IF;
END $$;

-- 5. Create service role full access policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Allow service role full access to site_settings'
    ) THEN
        CREATE POLICY "Allow service role full access to site_settings"
            ON public.site_settings FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Allow service role full access to settings'
    ) THEN
        CREATE POLICY "Allow service role full access to settings"
            ON public.settings FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- 6. Insert default shipping & delivery configuration into site_settings and settings
INSERT INTO public.site_settings (key, value)
VALUES (
    'shipping_config',
    '{
      "minOrderValue": 0,
      "freeShippingThreshold": 799,
      "tiers": [
        { "min": 0, "max": 499, "fee": 50 },
        { "min": 499, "max": 799, "fee": 30 },
        { "min": 799, "max": null, "fee": 0 }
      ]
    }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.settings (key, value)
VALUES (
    'shipping_config',
    '{
      "minOrderValue": 0,
      "freeShippingThreshold": 799,
      "tiers": [
        { "min": 0, "max": 499, "fee": 50 },
        { "min": 499, "max": 799, "fee": 30 },
        { "min": 799, "max": null, "fee": 0 }
      ]
    }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
