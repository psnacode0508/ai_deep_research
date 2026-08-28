import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[DeepResearch] Missing Supabase environment variables.\n" +
      "Copy .env.example to apps/web/.env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

/**
 * Browser-side Supabase client.
 *
 * Uses the ANON key (public — safe to expose in the browser).
 * The client automatically manages session persistence in localStorage
 * and refreshes the JWT before expiry.
 *
 * Import this singleton everywhere in the frontend that needs Supabase.
 * Never import the server-side `supabaseAdmin` client here.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
