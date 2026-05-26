/**
 * Cliente Supabase con `service_role` — bypassea RLS.
 *
 * SOLO usar en código que corre exclusivamente en el servidor:
 * Route Handlers, Server Actions, Server Components. NUNCA en un Client
 * Component, porque la clave quedaría expuesta al navegador.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
