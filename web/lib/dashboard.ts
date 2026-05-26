/**
 * Carga el JSON generado por el pipeline Python (proyecto_madrina/main.py).
 * Vive en `web/data/dashboard.json` — está gitignored porque contiene
 * nombres de docentes.
 *
 * Esto es la interfaz temporal mientras Supabase no es la fuente de verdad.
 * El día que se conecte, este archivo se reemplaza por consultas a Supabase
 * pero el `DashboardData` se mantiene como contrato.
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
  try {
    const raw = await fs.readFile(RUTA_DASHBOARD, "utf-8");
    return JSON.parse(raw) as DashboardData;
  } catch {
    return null;
  }
}
