import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com SERVICE ROLE.
 * ⚠️ NUNCA importar isto em client components.
 * Bypassa TODO o RLS. Usar apenas em server actions/route handlers
 * para operações privilegiadas (ex: criar profile no signup).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE env vars em falta (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}