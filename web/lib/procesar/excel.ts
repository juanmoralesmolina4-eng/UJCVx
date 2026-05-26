/**
 * Lectura del Excel de programación — espejo de cargar/programacion.py.
 *
 * Usa SheetJS (xlsx) que es muchísimo más eficiente que exceljs para
 * archivos con muchas filas vacías "fantasma" (el Excel real tiene
 * `max_row` ~ 1M aunque solo haya 260 filas con datos).
 */
import "server-only";

import * as XLSX from "xlsx";

import * as N from "./normalizar";
import type { Bloque, Clase } from "./modelo";
import type { Dia } from "@/lib/types";
import * as cfg from "./config";

const DIAS: Dia[] = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

export async function leerExcel(
  buffer: Buffer | ArrayBuffer,
  opciones: { omitirConsolidadas?: boolean } = {},
): Promise<Clase[]> {
  const { omitirConsolidadas = true } = opciones;

  const wb = XLSX.read(buffer, { type: "array", cellDates: false });

  const hojas = wb.SheetNames;
  const hojasALeer =
    omitirConsolidadas && hojas.length > 1
      ? hojas.filter((h) => !cfg.HOJAS_CONSOLIDADAS.has(h))
      : hojas;

  const clases: Clase[] = [];

  for (const nombre of hojasALeer) {
    const ws = wb.Sheets[nombre];
    if (!ws || !ws["!ref"]) continue;

    const range = XLSX.utils.decode_range(ws["!ref"]);
    const filaEncabezado = encontrarFilaEncabezado(ws, range);
    const primeraData = filaEncabezado + 1;

    let vaciasSeguidas = 0;

    for (let r = primeraData; r <= range.e.r; r++) {
      const valores = leerFila(ws, r, range);

      if (esFilaVacia(valores)) {
        vaciasSeguidas++;
        if (vaciasSeguidas >= cfg.LIMITE_FILAS_VACIAS_SEGUIDAS) break;
        continue;
      }
      vaciasSeguidas = 0;

      const clase = filaAClase(valores, nombre, r + 1); // r es 0-indexed; +1 para fila humana
      if (clase) clases.push(clase);
    }
  }

  return clases;
}

function leerFila(
  ws: XLSX.WorkSheet,
  r: number,
  range: XLSX.Range,
): unknown[] {
  const valores: unknown[] = [];
  const lim = Math.min(range.e.c, 25);
  for (let c = 0; c <= lim; c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = ws[addr];
    if (!cell) {
      valores.push(null);
      continue;
    }
    valores.push(cell.v ?? cell.w ?? null);
  }
  return valores;
}

function esFilaVacia(valores: unknown[]): boolean {
  return valores.every(
    (v) =>
      v === null ||
      v === undefined ||
      (typeof v === "string" && v.trim() === ""),
  );
}

function encontrarFilaEncabezado(
  ws: XLSX.WorkSheet,
  range: XLSX.Range,
): number {
  const limMax = Math.min(range.s.r + cfg.MAX_FILAS_BUSCAR_ENCABEZADO, range.e.r);
  for (let r = range.s.r; r <= limMax; r++) {
    for (let c = 0; c <= Math.min(range.e.c, 25); c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && typeof cell.v === "string" && cell.v.toUpperCase().includes("CATEDR")) {
        return r;
      }
    }
  }
  return 6; // 0-indexed: equivalente a la fila 7 en Excel
}

function filaAClase(
  cols: unknown[],
  hoja: string,
  fila: number,
): Clase | null {
  while (cols.length < 20) cols.push(null);

  const numero =
    typeof cols[0] === "number" ? Math.trunc(cols[0] as number) : null;
  const { nombre: catedratico, esNuevo } = N.nombreCatedratico(cols[1]);
  const { principal: codigo, alternos } = N.codigos(cols[2]);
  const asignatura = N.texto(cols[3]).toUpperCase();
  const carrera = N.texto(cols[4]).toUpperCase();

  if (!catedratico && !codigo && !asignatura) return null;

  const numAlumnos = N.alumnos(cols[5]);
  const modalidad = N.texto(cols[6]).toUpperCase();
  const aulaTxt = N.aula(cols[7]);
  const sec = N.seccion(cols[8]);
  const hPres = N.horas(cols[9]);
  const hAsin = N.horas(cols[10]);
  const hTot = N.horas(cols[11]);

  const bloques: Bloque[] = [];
  for (let i = 0; i < DIAS.length; i++) {
    bloques.push(...N.bloquesDia(DIAS[i], cols[12 + i]));
  }

  return {
    hoja,
    fila,
    numero,
    catedratico,
    catedraticoEsNuevo: esNuevo,
    codigo,
    codigosAlternos: alternos,
    asignatura,
    carrera,
    alumnos: numAlumnos,
    modalidad,
    aula: aulaTxt,
    seccion: sec,
    horasPresenciales: hPres,
    horasAsincronicas: hAsin,
    horasTotales: hTot,
    bloques,
    observaciones: N.texto(cols[19]),
  };
}
