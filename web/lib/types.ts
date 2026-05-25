/**
 * Tipos del dominio académico — espejo de proyecto_madrina/modelo.py.
 * Mantener sincronizados: si cambia uno, cambia el otro.
 */

export type Dia = "LUN" | "MAR" | "MIE" | "JUE" | "VIE" | "SAB" | "DOM";

export const DIAS: Dia[] = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

export type Modalidad = "PRESENCIAL" | "VIRTUAL" | "SEMIPRESENCIAL" | "SEMI-PRESENCIAL";

export type CampusCodigo = "T" | "C";
export type Campus = { codigo: CampusCodigo; nombre: string };

export const CAMPUSES: Record<CampusCodigo, Campus> = {
  T: { codigo: "T", nombre: "Tegucigalpa" },
  C: { codigo: "C", nombre: "Comayagua" },
};

/** Bloque horario en un día, en minutos desde medianoche. */
export interface Bloque {
  dia: Dia;
  inicioMin: number;
  finMin: number;
}

/** Sección de clase normalizada, agnóstica de la fuente (programación, Onlive, RRHH). */
export interface Clase {
  fuente: string;
  hoja: string;
  fila: number;

  numero: number | null;
  catedratico: string;
  catedraticoEsNuevo: boolean;
  codigo: string;
  codigosAlternos: string[];
  asignatura: string;
  carrera: string;
  alumnos: number | null;
  modalidad: Modalidad | string;
  aula: string;
  seccion: string;
  campus: CampusCodigo | null;
  horasPresenciales: number | null;
  horasAsincronicas: number | null;
  horasTotales: number | null;
  bloques: Bloque[];
  observaciones: string;
}

export type SeveridadProblema = "alta" | "media" | "baja";

export type TipoProblema =
  | "consolidacion_inconsistente"
  | "duplicado"
  | "solape_aula"
  | "solape_catedratico"
  | "horas_inconsistentes"
  | "horario_sospechoso"
  | "sobrecarga_docente"
  | "subutilizacion_docente"
  | "seccion_grande"
  | "diff_onlive";

export interface ReferenciaProblema {
  fuente: string;
  hoja: string;
  fila: number;
}

export interface Problema {
  tipo: TipoProblema;
  severidad: SeveridadProblema;
  descripcion: string;
  referencias: ReferenciaProblema[];
  extra?: Record<string, unknown>;
}

/* ──────────── Helpers de tiempo ──────────── */

export function minutosAHHMM(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}

export function duracionMin(b: Bloque): number {
  return b.finMin - b.inicioMin;
}

/** Cuenta horas clase de 50 min: 7:00–8:50 = 2 horas (7–7:50 y 8–8:50). */
export function horasClase(b: Bloque): number {
  return Math.ceil(duracionMin(b) / 60);
}

export function horasRealesSemanales(c: Clase): number {
  return c.bloques.reduce((acc, b) => acc + horasClase(b), 0);
}

export function esVirtual(c: Clase): boolean {
  return c.aula.toUpperCase().includes("VIRTUAL");
}

/** Extrae el código de campus del sufijo de la sección: "A-T" → "T", "A-C" → "C". */
export function campusDeSeccion(seccion: string): CampusCodigo | null {
  const upper = seccion.toUpperCase().replace(/\s+/g, "");
  if (upper.endsWith("-T") || upper.endsWith("T")) return "T";
  if (upper.endsWith("-C") || upper.endsWith("C")) return "C";
  return null;
}
