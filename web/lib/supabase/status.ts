/**
 * Verificación liviana de configuración de Supabase. Se ejecuta del lado del
 * servidor para mostrar el estado de conexión en la landing.
 */
export type SupabaseStatus =
  | { ok: true; url: string }
  | { ok: false; reason: "no_env" | "unreachable"; detail?: string };

export async function checkSupabase(): Promise<SupabaseStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { ok: false, reason: "no_env" };
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, reason: "unreachable", detail: `HTTP ${res.status}` };
    }
    return { ok: true, url };
  } catch (e) {
    return {
      ok: false,
      reason: "unreachable",
      detail: e instanceof Error ? e.message : "fetch failed",
    };
  }
}
