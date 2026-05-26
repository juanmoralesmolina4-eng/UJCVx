/**
 * Funciones de normalización — espejo de proyecto_madrina/normalizar.py.
 *
 * El Excel de programación trae los datos en formatos inconsistentes;
 * este módulo los lleva a estructuras canónicas.
 */
import type { Bloque } from "./modelo";
import type { Dia } from "@/lib/types";

const RE_HORA = /(\d{1,2})[:.](\d{2})/g;

export function texto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(/\n/g, " ").trim();
}

export function nombreCatedratico(valor: unknown): {
  nombre: string;
  esNuevo: boolean;
} {
  const raw = texto(valor).toUpperCase();
  if (!raw) return { nombre: "", esNuevo: false };
  const esNuevo = raw.includes("(NUEVO)");
  const limpio = raw.replace("(NUEVO)", "").replace(/\s+/g, " ").trim();
  return { nombre: limpio, esNuevo };
}

export function codigos(valor: unknown): {
  principal: string;
  alternos: string[];
} {
  const raw = texto(valor);
  if (!raw) return { principal: "", alternos: [] };
  const partes = raw
    .split(/[\/,]/)
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean);
  if (partes.length === 0) return { principal: "", alternos: [] };
  return { principal: partes[0], alternos: partes.slice(1) };
}

export function alumnos(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return Math.trunc(valor);
  const raw = texto(valor).replace(/\s/g, "");
  if (!raw) return null;
  const nums = raw.match(/\d+/g);
  if (!nums) return null;
  return nums.reduce((a, b) => a + parseInt(b, 10), 0);
}

export function horas(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return valor;
  const raw = texto(valor);
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function bloquesDia(dia: Dia, valor: unknown): Bloque[] {
  const raw = texto(valor);
  if (!raw) return [];

  // Sacar anotaciones (LAB, VIRTUAL, etc.) que no son horas
  const limpio = raw.replace(/\b(virtual|lab|laboratorio|presencial)\b/gi, " ");

  const horasFound: number[] = [];
  let m;
  RE_HORA.lastIndex = 0;
  while ((m = RE_HORA.exec(limpio)) !== null) {
    horasFound.push(parseInt(m[1], 10) * 60 + parseInt(m[2], 10));
  }

  if (horasFound.length < 2) return [];

  const bloques: Bloque[] = [];
  for (let i = 0; i + 1 < horasFound.length; i += 2) {
    const inicio = horasFound[i];
    const fin = horasFound[i + 1];
    if (fin <= inicio) continue;
    bloques.push({ dia, inicio, fin });
  }
  return bloques;
}

export function aula(valor: unknown): string {
  return texto(valor).toUpperCase().replace(/\s+/g, " ");
}

export function seccion(valor: unknown): string {
  return texto(valor).toUpperCase().replace(/\s+/g, "");
}

export function campusDeSeccion(seccionNormalizada: string): "T" | "C" {
  const s = seccionNormalizada.toUpperCase().replace(/\s+/g, "");
  if (s.endsWith("-C") || s.endsWith("C")) return "C";
  return "T";
}

export function modalidadCanonica(valor: unknown): string {
  const m = texto(valor).toUpperCase().replace(/[\s-]/g, "");
  if (m.startsWith("PRESEN")) return "PRESENCIAL";
  if (m.startsWith("VIRT")) return "VIRTUAL";
  if (m.startsWith("SEMI")) return "SEMIPRESENCIAL";
  return texto(valor).toUpperCase();
}

export function minutosAHHMM(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}
