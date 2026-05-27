/**
 * Queries de dominio reutilizables: catedráticos, aulas, clases con sus bloques.
 * Todas usan el cliente admin (server-only).
 */
import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Dia } from "@/lib/types";

export interface BloqueDB {
  dia: Dia;
  inicio_min: number;
  fin_min: number;
}

export interface ClaseDB {
  id: string;
  catedratico_nombre: string;
  catedratico_es_nuevo: boolean;
  codigo: string;
  asignatura_nombre: string;
  carrera_codigo: string | null;
  alumnos: number | null;
  modalidad: string | null;
  aula_texto: string;
  seccion: string;
  horas_presenciales: number | null;
  horas_asincronicas: number | null;
  horas_totales: number | null;
  observaciones: string | null;
  bloques_horarios: BloqueDB[];
}

async function _ultimaImportacionId(): Promise<string | null> {
  const sb = createSupabaseAdminClient();
  // Solo importaciones COMPLETADAS — si la última falló o está en proceso,
  // las páginas de catedráticos/aulas/pagos quedarían vacías sin razón.
  const { data } = await sb
    .from("importaciones")
    .select("id")
    .eq("tipo", "programacion")
    .eq("status", "completada")
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0]?.id ?? null;
}

/**
 * Lista las clases de la importación más reciente. Usar la importación (no
 * el periodo) evita duplicados cuando el mismo Excel se procesa varias veces.
 */
export async function listarClasesUltimoPeriodo(): Promise<ClaseDB[]> {
  const importacionId = await _ultimaImportacionId();
  if (!importacionId) return [];

  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("clases")
    .select(
      `id, catedratico_nombre, catedratico_es_nuevo, codigo, asignatura_nombre,
       carrera_codigo, alumnos, modalidad, aula_texto, seccion,
       horas_presenciales, horas_asincronicas, horas_totales, observaciones,
       bloques_horarios (dia, inicio_min, fin_min)`,
    )
    .eq("importacion_id", importacionId);

  return (data ?? []) as ClaseDB[];
}

export interface ResumenCatedratico {
  nombre: string;
  es_nuevo: boolean;
  n_clases: number;
  horas_semanales: number;
  carreras: string[];
  asignaturas_unicas: number;
}

export function agregarPorCatedratico(clases: ClaseDB[]): ResumenCatedratico[] {
  const map = new Map<string, {
    es_nuevo: boolean;
    clases: ClaseDB[];
    carreras: Set<string>;
    asignaturas: Set<string>;
  }>();

  for (const c of clases) {
    if (!c.catedratico_nombre) continue;
    let g = map.get(c.catedratico_nombre);
    if (!g) {
      g = {
        es_nuevo: c.catedratico_es_nuevo,
        clases: [],
        carreras: new Set(),
        asignaturas: new Set(),
      };
      map.set(c.catedratico_nombre, g);
    }
    g.clases.push(c);
    if (c.carrera_codigo) g.carreras.add(c.carrera_codigo);
    g.asignaturas.add(c.codigo);
    g.es_nuevo = g.es_nuevo || c.catedratico_es_nuevo;
  }

  return [...map.entries()]
    .map(([nombre, g]) => {
      const horas = g.clases.reduce(
        (acc, c) =>
          acc +
          c.bloques_horarios.reduce(
            (a, b) => a + (b.fin_min - b.inicio_min) / 60,
            0,
          ),
        0,
      );
      return {
        nombre,
        es_nuevo: g.es_nuevo,
        n_clases: g.clases.length,
        horas_semanales: Math.round(horas * 10) / 10,
        carreras: [...g.carreras].sort(),
        asignaturas_unicas: g.asignaturas.size,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export interface ResumenAula {
  codigo: string;
  n_clases: number;
  horas_semanales: number;
  catedraticos: string[];
  es_virtual: boolean;
}

export function agregarPorAula(clases: ClaseDB[]): ResumenAula[] {
  const map = new Map<string, {
    clases: ClaseDB[];
    catedraticos: Set<string>;
  }>();

  for (const c of clases) {
    const aula = (c.aula_texto || "").toUpperCase();
    if (!aula) continue;
    let g = map.get(aula);
    if (!g) {
      g = { clases: [], catedraticos: new Set() };
      map.set(aula, g);
    }
    g.clases.push(c);
    if (c.catedratico_nombre) g.catedraticos.add(c.catedratico_nombre);
  }

  return [...map.entries()]
    .map(([codigo, g]) => {
      const horas = g.clases.reduce(
        (acc, c) =>
          acc +
          c.bloques_horarios.reduce(
            (a, b) => a + (b.fin_min - b.inicio_min) / 60,
            0,
          ),
        0,
      );
      return {
        codigo,
        n_clases: g.clases.length,
        horas_semanales: Math.round(horas * 10) / 10,
        catedraticos: [...g.catedraticos].sort(),
        es_virtual: codigo.includes("VIRTUAL"),
      };
    })
    .sort((a, b) => {
      if (a.es_virtual !== b.es_virtual) return a.es_virtual ? 1 : -1;
      return a.codigo.localeCompare(b.codigo);
    });
}

export function clasesDeCatedratico(
  clases: ClaseDB[],
  nombre: string,
): ClaseDB[] {
  return clases.filter((c) => c.catedratico_nombre === nombre);
}

export function clasesDeAula(clases: ClaseDB[], codigo: string): ClaseDB[] {
  const target = codigo.toUpperCase();
  return clases.filter((c) => (c.aula_texto || "").toUpperCase() === target);
}
