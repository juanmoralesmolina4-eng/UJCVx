"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { procesarImportacion } from "@/lib/procesar/pipeline";

/** Quita tildes, espacios y caracteres especiales — Supabase Storage solo
 *  acepta `[A-Za-z0-9!\-_.\*'()]`. */
function sanitizarNombre(nombre: string): string {
  const sinTildes = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return sinTildes.replace(/[^A-Za-z0-9._-]/g, "_").replace(/_+/g, "_");
}

export interface ResultadoSubida {
  ok: boolean;
  importacionId?: string;
  mensaje?: string;
  totalClases?: number;
  totalProblemas?: number;
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
  const nombreLimpio = sanitizarNombre(archivo.name);
  const objectPath = `programacion/${stamp}__${nombreLimpio}`;

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
    const { data: nuevo, error: errPeriodo } = await sb
      .from("periodos")
      .insert({ codigo: "2026-II", anio: 2026, numero: 2 })
      .select("id")
      .single();
    if (errPeriodo || !nuevo?.id) {
      return {
        ok: false,
        mensaje: `No se pudo registrar el período: ${errPeriodo?.message ?? "sin detalle"}`,
      };
    }
    periodoId = nuevo.id;
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

  // Procesar de inmediato (lectura del Excel + validaciones + persistencia)
  const resultado = await procesarImportacion(imp.id);

  revalidatePath("/importaciones");
  revalidatePath("/validacion");
  revalidatePath("/eficiencia");
  revalidatePath("/catedraticos");
  revalidatePath("/aulas");

  if (!resultado.ok) {
    return {
      ok: false,
      importacionId: imp.id,
      mensaje: `Procesamiento: ${resultado.mensaje}`,
    };
  }

  return {
    ok: true,
    importacionId: imp.id,
    totalClases: resultado.totalClases,
    totalProblemas: resultado.totalProblemas,
  };
}
