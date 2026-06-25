import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Supabase not fully configured: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing",
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const isConfigured = 
  Boolean(supabaseUrl && !supabaseUrl.includes("placeholder"));

export const supabasePublic = createClient(url, anonKey, {
  auth: { persistSession: false },
});

/** Server-side client — must use the service role key, not the anon key. */
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

export default supabaseAdmin;
