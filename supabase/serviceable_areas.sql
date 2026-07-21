-- SQL Migration script to create site_settings table and seed serviceable states & cities data.
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create site_settings key-value table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Insert default serviceable states and cities into site_settings
INSERT INTO public.site_settings (key, value)
VALUES (
  'serviceable_areas',
  '{
    "Telangana": [
      "Hyderabad",
      "Secunderabad",
      "Warangal",
      "Hanamkonda",
      "Karimnagar",
      "Nizamabad",
      "Khammam",
      "Mahabubnagar",
      "Siddipet",
      "Suryapet",
      "Nalgonda",
      "Adilabad",
      "Ramagundam"
    ],
    "Andhra Pradesh": [
      "Visakhapatnam",
      "Vijayawada",
      "Rajahmundry",
      "Kakinada",
      "Guntur",
      "Nellore",
      "Tirupati",
      "Kurnool",
      "Anantapur",
      "Kadapa",
      "Eluru",
      "Ongole",
      "Srikakulam",
      "Vizianagaram",
      "Machilipatnam",
      "Tenali",
      "Bhimavaram",
      "Tadepalligudem",
      "Narasaraopet",
      "Chittoor"
    ]
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow public read access to site_settings (for checkout & location gate)
DROP POLICY IF EXISTS "Allow public read access to site_settings" ON public.site_settings;
CREATE POLICY "Allow public read access to site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- 5. Policy: Allow service_role / authenticated admin full access to update settings
DROP POLICY IF EXISTS "Allow service_role full access to site_settings" ON public.site_settings;
CREATE POLICY "Allow service_role full access to site_settings"
  ON public.site_settings FOR ALL
  USING (true);
