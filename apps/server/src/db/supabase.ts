import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env";

/**
 * Server-side Supabase admin client.
 *
 * Uses the SERVICE ROLE KEY — this client bypasses Row Level Security
 * and has full database access. It MUST only be used server-side.
 *
 * Primary use in Milestone 1: verifying user JWTs from incoming requests.
 * Do NOT import this module in any file that might be bundled for the browser.
 */
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      // Disable automatic session management — server is stateless
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);
