import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

// Client for authenticated users (subject to RLS)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client that bypasses RLS (use for server-side operations without auth)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type SupabaseClient = typeof supabaseClient;

/**
 * Default user ID for unauthenticated operations
 */

export const DEFAULT_USER_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
