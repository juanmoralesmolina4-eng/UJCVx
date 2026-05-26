/**
 * Carga los datos del dashboard. Intenta Supabase primero; si no hay datos
 * o falla, cae al JSON local generado por el pipeline Python.
 *
 * El `DashboardData` es el contrato estable que consumen las páginas —
 * la fuente subyacente es indistinta.
 */
import fs from "node:fs/promises";
import path from "node:path";

import type { Dia } from "@/lib/types";

export interface ReferenciaProblema {
  fuente: string;
  hoja: string;
  fila: number;
}

export interface ProblemaJSON {
  tipo: string;
  severidad: "alta" | "media" | "baja";
  descripcion: string;
  referencias: ReferenciaProblema[];
  extra: Record<string, unknown>;
}

export interface MetricaAulaJSON {
  aula: string;
  horas_ocupadas: number;
  porcentaje_ocupacion: number;
  n_clases: number;
  n_catedraticos: number;
  horas_por_dia: Record<Dia, number>;
}

export interface MetricaDocenteJSON {
  catedratico: string;
  horas_semanales: number;
  n_dias: number;
  n_clases: number;
  horas_huecos: number;
  ratio_eficiencia: number;
  carreras: string[];
  aulas: string[];
}

export interface DashboardData {
  generado_at: string;
  totales: {
    clases: number;
    catedraticos: number;
    problemas: number;
    aulas: number;
  };
  problemas_por_tipo: Record<string, number>;
  problemas: ProblemaJSON[];
  metricas_aulas: MetricaAulaJSON[];
  metricas_docentes: MetricaDocenteJSON[];
}

const RUTA_DASHBOARD = path.resolve(
  process.cwd(),
  "data",
  "dashboard.json",
);

export async function cargarDashboard(): Promise<DashboardData | null> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { cargarDashboardDesdeSupabase } = await import(
        "@/lib/supabase/queries"
      );
      const desdeDb = await cargarDashboardDesdeSupabase();
      if (desdeDb) return desdeDb;
    } catch (e) {
      console.warn("[dashboard] Supabase falló, usando JSON local:", e);
    }
  }

  try {
    const raw = await fs.readFile(RUTA_DASHBOARD, "utf-8");
    return JSON.parse(raw) as DashboardData;
  } catch {
    return null;
  }
}
