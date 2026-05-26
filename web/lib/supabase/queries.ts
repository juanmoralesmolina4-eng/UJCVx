/**
 * Queries tipadas contra Supabase.
 *
 * Estas funciones devuelven el mismo shape que `lib/dashboard.ts` para que el
 * resto del código no se entere de la fuente. Cuando hay datos en Supabase,
 * se usan; cuando no, se cae al JSON local.
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

/**
 * Trae la última corrida + sus problemas + las clases más recientes del
 * mismo periodo. Calcula métricas on-the-fly desde las clases.
 */
export async function cargarDashboardDesdeSupabase(): Promise<DashboardData | null> {
  const sb = createSupabaseAdminClient();

  const { data: corridas, error: errCor } = await sb
    .from("corridas_validacion")
    .select("id, created_at, total_clases, total_problemas, resumen, periodo_id")
    .order("created_at", { ascending: false })
    .limit(1);

  if (errCor || !corridas || corridas.length === 0) return null;

  const corrida = corridas[0] as CorridaRow & { periodo_id: string };

  const { data: problemasRaw } = await sb
    .from("problemas")
    .select("id, tipo, severidad, descripcion, referencias, extra, resuelto, nota_resolucion")
    .eq("corrida_id", corrida.id);

  const { data: clasesRaw } = await sb
    .from("clases")
    .select(
      `id, catedratico_nombre, codigo, asignatura_nombre, carrera_codigo,
       alumnos, modalidad, aula_texto, seccion,
       horas_presenciales, horas_asincronicas, horas_totales,
       bloques_horarios (dia, inicio_min, fin_min)`,
    )
    .eq("periodo_id", corrida.periodo_id);

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

  return {
    generado_at: corrida.created_at,
    totales: {
      clases: corrida.total_clases ?? clases.length,
      catedraticos: catedraticos.size,
      problemas: corrida.total_problemas ?? problemas.length,
      aulas: metricas_aulas.length,
    },
    problemas_por_tipo: corrida.resumen ?? contarPorTipo(problemas),
    problemas,
    metricas_aulas,
    metricas_docentes,
  };
}

/* ─── Helpers de cálculo (espejo del Python en metricas/) ─── */

const HORAS_JORNADA_SEMANA = (21 - 7) * 6; // 7:00 a 21:00 lun-sáb = 84 h

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
