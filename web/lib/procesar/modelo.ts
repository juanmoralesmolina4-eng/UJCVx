/**
 * Modelos del pipeline — espejo de proyecto_madrina/modelo.py.
 */
import type { Dia } from "@/lib/types";

export interface Bloque {
  dia: Dia;
  inicio: number;
  fin: number;
}

export interface Clase {
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
  modalidad: string;
  aula: string;
  seccion: string;
  horasPresenciales: number | null;
  horasAsincronicas: number | null;
  horasTotales: number | null;
  bloques: Bloque[];
  observaciones: string;
}

export interface ReferenciaProblema {
  hoja: string;
  fila: number;
}

export type SeveridadProblema = "alta" | "media" | "baja";

export interface Problema {
  tipo: string;
  severidad: SeveridadProblema;
  descripcion: string;
  referencias: ReferenciaProblema[];
  extra: Record<string, unknown>;
}

export function esVirtual(c: Clase): boolean {
  return c.aula.toUpperCase().includes("VIRTUAL");
}

export function horasClase(b: Bloque): number {
  return Math.ceil((b.fin - b.inicio) / 60);
}

export function horasRealesSemanales(c: Clase): number {
  return c.bloques.reduce((acc, b) => acc + horasClase(b), 0);
}

export function duracionMin(b: Bloque): number {
  return b.fin - b.inicio;
}
