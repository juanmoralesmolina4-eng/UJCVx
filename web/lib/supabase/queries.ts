/**
 * Queries tipadas contra Supabase.
 *
 * Multi-campus: combina las últimas importaciones COMPLETADAS de cada campus
 * (Tegucigalpa y Comayagua). Las métricas y problemas mostrados en el
 * dashboard suman datos de ambos campus si están ambos cargados.
 */
import { createSupabaseAdminClient } from "./admin";
import type {
  DashboardData,
  MetricaAulaJSON,
  MetricaDocenteJSON,
  ProblemaJSON,
  ReferenciaProblema,
} from "@/lib/dashboard";

type DiaSemana = "LUN" | "MAR" | "MIE" | "JUE" | "VIE" | "SAB" | "DOM";
type CampusCodigo = "T" | "C";

interface BloqueRow {
  dia: DiaSemana;
  inicio_min: number;
  fin_min: number;
}

interface ClaseRow {
  id: string;
  catedratico_nombre: string;
  codigo: string;
  asignatura_nombre: string;
  carrera_codigo: string | null;
  alumnos: number | null;
  modalidad: string | null;
  aula_texto: string;
  seccion: string;
  campus_codigo: string | null;
  horas_presenciales: number | null;
  horas_asincronicas: number | null;
  horas_totales: number | null;
  bloques_horarios: BloqueRow[];
}

interface ProblemaRow {
  id: string;
  tipo: string;
  severidad: "alta" | "media" | "baja";
  descripcion: string;
  referencias: ReferenciaProblema[] | null;
  extra: Record<string, unknown> | null;
  resuelto: boolean | null;
  nota_resolucion: string | null;
}

interface CorridaRow {
  id: string;
  created_at: string;
  total_clases: number | null;
  total_problemas: number | null;
  resumen: Record<string, number> | null;
}

async function _ultimasImportacionesPorCampus(): Promise<
  Map<CampusCodigo, { id: string; periodo_id: string }>
> {
  const sb = createSupabaseAdminClient();
  const { data: imps } = await sb
    .from("importaciones")
    .select("id, periodo_id, campus_codigo")
    .eq("tipo", "programacion")
    .eq("status", "completada")
    .order("created_at", { ascending: false })
    .limit(20);

  const out = new Map<CampusCodigo, { id: string; periodo_id: string }>();
  if (!imps) return out;

  for (const imp of imps) {
    let campus = imp.campus_codigo as CampusCodigo | null;
    // Fallback para importaciones viejas que no tienen campus_codigo guardado
    if (!campus) {
      const { data: muestra } = await sb
        .from("clases")
        .select("campus_codigo")
        .eq("importacion_id", imp.id)
        .limit(1);
      campus = (muestra?.[0]?.campus_codigo as CampusCodigo | undefined) ?? null;
    }
    if (campus && !out.has(campus)) {
      out.set(campus, { id: imp.id as string, periodo_id: imp.periodo_id as string });
    }
    if (out.size === 2) break;
  }

  return out;
}

async function _ultimasCorridasPorCampus(): Promise<
  Map<CampusCodigo, CorridaRow>
> {
  const sb = createSupabaseAdminClient();
  const { data: corridas } = await sb
    .from("corridas_validacion")
    .select("id, created_at, total_clases, total_problemas, resumen, campus_codigo")
    .order("created_at", { ascending: false })
    .limit(20);

  const out = new Map<CampusCodigo, CorridaRow>();
  if (!corridas) return out;

  for (const c of corridas) {
    const campus = c.campus_codigo as CampusCodigo | null;
    if (campus && !out.has(campus)) {
      out.set(campus, c as CorridaRow);
    }
    if (out.size === 2) break;
  }

  // Fallback: si ninguna corrida tiene campus_codigo (corridas viejas pre-fix),
  // devolvemos al menos la más reciente bajo un campus dummy para no quedarnos
  // con dashboard vacío.
  if (out.size === 0 && corridas.length > 0) {
    out.set("T", corridas[0] as CorridaRow);
  }

  return out;
}

export async function cargarDashboardDesdeSupabase(): Promise<DashboardData | null> {
  const sb = createSupabaseAdminClient();

  const corridasPorCampus = await _ultimasCorridasPorCampus();
  if (corridasPorCampus.size === 0) return null;

  // Combinamos problemas de todas las últimas corridas (una por campus)
  const corridaIds = [...corridasPorCampus.values()].map((c) => c.id);
  const { data: problemasRaw } = await sb
    .from("problemas")
    .select(
      "id, tipo, severidad, descripcion, referencias, extra, resuelto, nota_resolucion",
    )
    .in("corrida_id", corridaIds);

  // Combinamos clases de todas las últimas importaciones (una por campus)
  const impsPorCampus = await _ultimasImportacionesPorCampus();
  const importacionIds = [...impsPorCampus.values()].map((i) => i.id);
  if (importacionIds.length === 0) return null;

  const { data: clasesRaw } = await sb
    .from("clases")
    .select(
      `id, catedratico_nombre, codigo, asignatura_nombre, carrera_codigo,
       alumnos, modalidad, aula_texto, seccion, campus_codigo,
       horas_presenciales, horas_asincronicas, horas_totales,
       bloques_horarios (dia, inicio_min, fin_min)`,
    )
    .in("importacion_id", importacionIds);

  const clases = (clasesRaw ?? []) as ClaseRow[];
  const problemas: ProblemaJSON[] = (problemasRaw ?? []).map(
    (p: ProblemaRow) => ({
      id: p.id,
      tipo: p.tipo,
      severidad: p.severidad,
      descripcion: p.descripcion,
      referencias: p.referencias ?? [],
      extra: p.extra ?? {},
      resuelto: p.resuelto ?? false,
      nota_resolucion: p.nota_resolucion,
    }),
  );

  const metricas_aulas = calcularMetricasAulas(clases);
  const metricas_docentes = calcularMetricasDocentes(clases);

  const catedraticos = new Set(
    clases.map((c) => c.catedratico_nombre).filter(Boolean),
  );

  const resumenAgregado: Record<string, number> = {};
  for (const c of corridasPorCampus.values()) {
    if (!c.resumen) continue;
    for (const [k, v] of Object.entries(c.resumen)) {
      resumenAgregado[k] = (resumenAgregado[k] ?? 0) + v;
    }
  }

  const generadoAt =
    [...corridasPorCampus.values()]
      .map((c) => c.created_at)
      .sort()
      .at(-1) ?? new Date().toISOString();

  return {
    generado_at: generadoAt,
    totales: {
      clases: clases.length,
      catedraticos: catedraticos.size,
      problemas: problemas.length,
      aulas: metricas_aulas.length,
    },
    problemas_por_tipo:
      Object.keys(resumenAgregado).length > 0
        ? resumenAgregado
        : contarPorTipo(problemas),
    problemas,
    metricas_aulas,
    metricas_docentes,
  };
}

/* ─── Helpers de cálculo (espejo del Python en metricas/) ─── */

const HORAS_JORNADA_SEMANA = (21 - 7) * 6;

function calcularMetricasAulas(clases: ClaseRow[]): MetricaAulaJSON[] {
  const porAula = new Map<
    string,
    {
      n_clases: number;
      catedraticos: Set<string>;
      horas: Record<DiaSemana, number>;
    }
  >();

  for (const c of clases) {
    const aula = (c.aula_texto || "").toUpperCase();
    if (!aula || aula.includes("VIRTUAL")) continue;

    let m = porAula.get(aula);
    if (!m) {
      m = {
        n_clases: 0,
        catedraticos: new Set(),
        horas: { LUN: 0, MAR: 0, MIE: 0, JUE: 0, VIE: 0, SAB: 0, DOM: 0 },
      };
      porAula.set(aula, m);
    }
    m.n_clases++;
    if (c.catedratico_nombre) m.catedraticos.add(c.catedratico_nombre);
    for (const b of c.bloques_horarios) {
      m.horas[b.dia] += (b.fin_min - b.inicio_min) / 60;
    }
  }

  return [...porAula.entries()]
    .map(([aula, m]) => {
      const horas_ocupadas = Object.values(m.horas).reduce((a, b) => a + b, 0);
      return {
        aula,
        horas_ocupadas: round1(horas_ocupadas),
        porcentaje_ocupacion: round1((100 * horas_ocupadas) / HORAS_JORNADA_SEMANA),
        n_clases: m.n_clases,
        n_catedraticos: m.catedraticos.size,
        horas_por_dia: Object.fromEntries(
          Object.entries(m.horas).map(([k, v]) => [k, round1(v)]),
        ) as Record<DiaSemana, number>,
      };
    })
    .sort((a, b) => b.porcentaje_ocupacion - a.porcentaje_ocupacion);
}

function calcularMetricasDocentes(clases: ClaseRow[]): MetricaDocenteJSON[] {
  const porCated = new Map<
    string,
    {
      n_clases: number;
      bloques: BloqueRow[];
      carreras: Set<string>;
      aulas: Set<string>;
    }
  >();

  for (const c of clases) {
    const cated = c.catedratico_nombre;
    if (!cated || cated === "P.D." || cated === "SIN ASIGNAR") continue;

    let m = porCated.get(cated);
    if (!m) {
      m = { n_clases: 0, bloques: [], carreras: new Set(), aulas: new Set() };
      porCated.set(cated, m);
    }
    m.n_clases++;
    if (c.carrera_codigo) m.carreras.add(c.carrera_codigo);
    if (c.aula_texto) m.aulas.add(c.aula_texto);
    m.bloques.push(...c.bloques_horarios);
  }

  return [...porCated.entries()]
    .map(([cated, m]) => {
      const horas_semanales = m.bloques.reduce(
        (acc, b) => acc + (b.fin_min - b.inicio_min) / 60,
        0,
      );
      const dias_trabajados = new Set(m.bloques.map((b) => b.dia));
      const horas_huecos = calcularHuecos(m.bloques);
      const en_campus = horas_semanales + horas_huecos;
      const ratio = en_campus > 0 ? horas_semanales / en_campus : 0;

      return {
        catedratico: cated,
        horas_semanales: round1(horas_semanales),
        n_dias: dias_trabajados.size,
        n_clases: m.n_clases,
        horas_huecos: round1(horas_huecos),
        ratio_eficiencia: round1(ratio * 100),
        carreras: [...m.carreras].sort(),
        aulas: [...m.aulas].sort(),
      };
    })
    .sort((a, b) => b.horas_semanales - a.horas_semanales);
}

function calcularHuecos(bloques: BloqueRow[]): number {
  const porDia = new Map<DiaSemana, BloqueRow[]>();
  for (const b of bloques) {
    if (!porDia.has(b.dia)) porDia.set(b.dia, []);
    porDia.get(b.dia)!.push(b);
  }

  let huecos = 0;
  for (const dia of porDia.values()) {
    const ordenados = [...dia].sort((a, b) => a.inicio_min - b.inicio_min);
    for (let i = 1; i < ordenados.length; i++) {
      const gap = ordenados[i].inicio_min - ordenados[i - 1].fin_min;
      if (gap > 0) huecos += gap;
    }
  }
  return huecos / 60;
}

function contarPorTipo(problemas: ProblemaJSON[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const p of problemas) m[p.tipo] = (m[p.tipo] ?? 0) + 1;
  return m;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
