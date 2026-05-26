/**
 * Cliente de Supabase para uso en Client Components (browser).
 * Usa la `anon key` — segura para exponer al navegador porque RLS
 * controla qué puede hacer cada usuario.
 */
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
