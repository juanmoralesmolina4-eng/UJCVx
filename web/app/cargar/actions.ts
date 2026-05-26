"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface ResultadoSubida {
  ok: boolean;
  importacionId?: string;
  mensaje?: string;
}

export async function subirExcel(formData: FormData): Promise<ResultadoSubida> {
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) {
    return { ok: false, mensaje: "No se recibió ningún archivo" };
  }
  if (!archivo.name.toLowerCase().endsWith(".xlsx")) {
    return { ok: false, mensaje: "Solo se aceptan archivos .xlsx" };
  }
  if (archivo.size > 50 * 1024 * 1024) {
    return { ok: false, mensaje: "El archivo excede 50 MB" };
  }

  const sb = createSupabaseAdminClient();

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const objectPath = `programacion/${stamp}__${archivo.name}`;

  const buffer = Buffer.from(await archivo.arrayBuffer());

  const { error: storageError } = await sb.storage
    .from("uploads")
    .upload(objectPath, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

  if (storageError) {
    return { ok: false, mensaje: `Storage: ${storageError.message}` };
  }

  const { data: periodo } = await sb
    .from("periodos")
    .select("id")
    .eq("codigo", "2026-II")
    .maybeSingle();

  let periodoId: string | undefined = periodo?.id;
  if (!periodoId) {
    const { data: nuevo } = await sb
      .from("periodos")
      .insert({ codigo: "2026-II", anio: 2026, numero: 2 })
      .select("id")
      .single();
    periodoId = nuevo?.id;
  }

  const { data: imp, error: impError } = await sb
    .from("importaciones")
    .insert({
      tipo: "programacion",
      archivo: objectPath,
      periodo_id: periodoId,
      status: "pendiente",
    })
    .select("id")
    .single();

  if (impError || !imp) {
    return {
      ok: false,
      mensaje: `Importación: ${impError?.message ?? "sin id"}`,
    };
  }

  revalidatePath("/importaciones");
  return { ok: true, importacionId: imp.id };
}
