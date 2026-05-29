/**
 * Orquestador del pipeline: descarga del Storage → lee Excel → valida →
 * persiste en Supabase. Espejo de proyecto_madrina/main.py + sync_supabase.py.
 */
import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { leerExcel } from "./excel";
import * as N from "./normalizar";
import type { Clase, Problema } from "./modelo";
import { correrTodasLasValidaciones } from "./validaciones";

export interface ResultadoPipeline {
  ok: boolean;
  importacionId: string;
  totalClases: number;
  totalProblemas: number;
  mensaje?: string;
}

export async function procesarImportacion(
  importacionId: string,
): Promise<ResultadoPipeline> {
  const sb = createSupabaseAdminClient();

  await sb
    .from("importaciones")
    .update({ status: "procesando" })
    .eq("id", importacionId);

  try {
    const { data: imp, error: errImp } = await sb
      .from("importaciones")
      .select("id, archivo, periodo_id")
      .eq("id", importacionId)
      .single();

    if (errImp || !imp) {
      throw new Error(`Importación no encontrada: ${errImp?.message}`);
    }

    const { data: file, error: errFile } = await sb.storage
      .from("uploads")
      .download(imp.archivo);

    if (errFile || !file) {
      throw new Error(`No se pudo descargar el archivo: ${errFile?.message}`);
    }

    const arrayBuffer = await file.arrayBuffer();

    const clasesValidacion = await leerExcel(arrayBuffer, {
      omitirConsolidadas: true,
    });
    const clasesConsolidacion = await leerExcel(arrayBuffer, {
      omitirConsolidadas: false,
    });

    const problemas = correrTodasLasValidaciones(
      clasesValidacion,
      clasesConsolidacion,
    );

    // Como convención, cada archivo viene de un solo campus. Lo deducimos
    // del sufijo de sección de la primera clase para etiquetar la
    // importación y la corrida.
    const campusCodigo =
      clasesValidacion.length > 0
        ? N.campusDeSeccion(clasesValidacion[0].seccion)
        : null;

    // Borra clases previas de esta importación (idempotencia)
    await sb.from("clases").delete().eq("importacion_id", importacionId);

    await insertarClases(
      sb,
      clasesValidacion,
      imp.periodo_id,
      importacionId,
    );

    const resumen = problemas.reduce<Record<string, number>>((acc, p) => {
      acc[p.tipo] = (acc[p.tipo] ?? 0) + 1;
      return acc;
    }, {});

    const { data: corrida } = await sb
      .from("corridas_validacion")
      .insert({
        periodo_id: imp.periodo_id,
        campus_codigo: campusCodigo,
        total_clases: clasesValidacion.length,
        total_problemas: problemas.length,
        resumen,
      })
      .select("id")
      .single();

    if (corrida && problemas.length > 0) {
      const lotes = chunk(
        problemas.map((p) => ({
          corrida_id: corrida.id,
          tipo: p.tipo,
          severidad: p.severidad,
          descripcion: p.descripcion,
          referencias: p.referencias.map((r) => ({
            fuente: "PROGRAMACION",
            hoja: r.hoja,
            fila: r.fila,
          })),
          extra: p.extra,
        })),
        200,
      );
      for (const lote of lotes) {
        await sb.from("problemas").insert(lote);
      }
    }

    await sb
      .from("importaciones")
      .update({
        status: "completada",
        campus_codigo: campusCodigo,
        total_filas: clasesValidacion.length,
        procesada_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", importacionId);

    return {
      ok: true,
      importacionId,
      totalClases: clasesValidacion.length,
      totalProblemas: problemas.length,
    };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    await sb
      .from("importaciones")
      .update({ status: "fallida", error: mensaje })
      .eq("id", importacionId);

    return {
      ok: false,
      importacionId,
      totalClases: 0,
      totalProblemas: 0,
      mensaje,
    };
  }
}

async function insertarClases(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  clases: Clase[],
  periodoId: string,
  importacionId: string,
): Promise<void> {
  if (clases.length === 0) return;

  // Generamos un identificador único por fila ANTES de insertar, así
  // sabemos exactamente a qué `Clase` corresponde cada `id` que devuelve
  // Supabase (no podemos confiar en que el orden de retorno sea el mismo
  // que el orden de inserción).
  const filasConRef = clases.map((c, i) => ({
    indice: i,
    fila: {
      periodo_id: periodoId,
      campus_codigo: N.campusDeSeccion(c.seccion),
      importacion_id: importacionId,
      hoja_origen: c.hoja,
      fila_origen: c.fila,
      catedratico_nombre: c.catedratico || "SIN ASIGNAR",
      catedratico_es_nuevo: c.catedraticoEsNuevo,
      codigo: c.codigo || "?",
      codigos_alternos: c.codigosAlternos.length ? c.codigosAlternos : null,
      asignatura_nombre: c.asignatura || "?",
      carrera_codigo: c.carrera || null,
      alumnos: c.alumnos,
      modalidad: N.modalidadCanonica(c.modalidad),
      aula_texto: c.aula || "",
      seccion: c.seccion || "?",
      horas_presenciales: c.horasPresenciales,
      horas_asincronicas: c.horasAsincronicas,
      horas_totales: c.horasTotales,
      observaciones: c.observaciones || "",
    },
  }));

  // Insertamos en lotes y reasociamos los IDs devueltos a cada Clase original
  // usando (hoja_origen, fila_origen) como clave — esos campos son únicos
  // dentro de una importación.
  const idPorRef = new Map<string, string>();
  const lotes = chunk(filasConRef, 100);
  for (const lote of lotes) {
    const { data, error } = await sb
      .from("clases")
      .insert(lote.map((l) => l.fila))
      .select("id, hoja_origen, fila_origen");
    if (error) {
      throw new Error(`Insert de clases falló: ${error.message}`);
    }
    if (!data || data.length !== lote.length) {
      throw new Error(
        `Insert de clases devolvió ${data?.length ?? 0} filas, esperaba ${lote.length}`,
      );
    }
    for (const fila of data) {
      idPorRef.set(`${fila.hoja_origen}::${fila.fila_origen}`, fila.id);
    }
  }

  const filasBloques: {
    clase_id: string;
    dia: string;
    inicio_min: number;
    fin_min: number;
  }[] = [];
  for (const c of clases) {
    const claseId = idPorRef.get(`${c.hoja}::${c.fila}`);
    if (!claseId) continue;
    for (const b of c.bloques) {
      filasBloques.push({
        clase_id: claseId,
        dia: b.dia,
        inicio_min: b.inicio,
        fin_min: b.fin,
      });
    }
  }

  const lotesB = chunk(filasBloques, 200);
  for (const lote of lotesB) {
    await sb.from("bloques_horarios").insert(lote);
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

// Mantiene la importación de Problema viva para que el tipo se exporte
export type { Problema };
