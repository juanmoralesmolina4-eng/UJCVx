"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function marcarProblema(
  id: string,
  resuelto: boolean,
  nota?: string,
): Promise<{ ok: boolean; mensaje?: string }> {
  const sb = createSupabaseAdminClient();

  const { error } = await sb
    .from("problemas")
    .update({
      resuelto,
      resuelto_at: resuelto ? new Date().toISOString() : null,
      nota_resolucion: nota ?? null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/validacion");
  revalidatePath("/importaciones");
  return { ok: true };
}
