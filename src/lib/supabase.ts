import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient | null = null;

/**
 * Server-only client using the service role key — bypasses Row Level
 * Security, so it must never be imported into client components or exposed
 * to the browser. Use only inside app/api/** route handlers.
 *
 * Returns null (rather than throwing) when env vars aren't set yet, so the
 * AI pipeline still works end-to-end before you've wired up Supabase —
 * persistence is treated as best-effort, not a hard dependency.
 */
export function getServerSupabase(): SupabaseClient | null {
  if (!url || !serviceRoleKey) return null;
  if (cached) return cached;
  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cached;
}
