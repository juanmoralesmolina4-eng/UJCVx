/**
 * Genera el Excel de pago en el formato exacto de COMAYAGUA (34 columnas).
 * Espejo de proyecto_madrina/exportar/rrhh.py.
 */
import "server-only";

import ExcelJS from "exceljs";

import type { PagoCatedraticoCalculado, PagoClaseCalculado } from "./calculo";

const COLUMNAS = [
  "N°", "CATEDRÁTICO/A", "ASIGNATURA", "CARRERA", "CODIGO",
  "MODALIDAD", "AULA", "SECCIÓN", "ALUMNOS",
  "HORAS POR SEMANA", "HORAS ASINCRONICAS",
  "LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM",
  "TIPO CONTRATACION", "OBSERVACIONES",
  "HORAS ASINCRONAS",
  "VALOR POR PERIODO COMPLETO",
  "SEMANAS A PAGAR",
  "HORAS POR SEMANA ",
  "HORAS TOTALES",
  "VALOR POR HORA CLASE", "VALOR POR CLASE",
  "TOTAL INGRESOS",
  "I.H.S.S", "UJCV", "EMBARGO", "ACH",
  "TOTAL DEDUCCIONES", "TOTAL A PAGAR",
];

const ANCHOS = [
  5, 32, 32, 14, 12, 16, 14, 10, 9,
  10, 10,
  14, 14, 14, 14, 14, 14, 14,
  20, 30, 10,
  13, 9, 11, 11, 13, 12,
  13, 9, 9, 9, 9, 14, 14,
];

const DIAS: ("LUN" | "MAR" | "MIE" | "JUE" | "VIE" | "SAB" | "DOM")[] = [
  "LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM",
];

interface OpcionesPago {
  titulo?: string;
  campusNombre?: string;
  periodo?: string;
  semanasAPagar: number;
}

export async function generarExcelPago(
  pagos: PagoCatedraticoCalculado[],
  opciones: OpcionesPago,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "UJCVx";
  wb.created = new Date();

  const titulo = opciones.titulo ?? "PRIMER PAGO DOCENTE";
  const campus = opciones.campusNombre ?? "TEGUCIGALPA";
  const periodo = opciones.periodo ?? "II PAC 2026";

  // Hoja consolidada
  const wsConsol = wb.addWorksheet("PROGRAMACION GENERAL");
  escribirEncabezadoHoja(wsConsol, titulo, campus, periodo);
  escribirTabla(wsConsol, pagos, opciones.semanasAPagar);
  aplicarAnchos(wsConsol);

  // Una hoja por carrera (deducida del campo `carrera_codigo` de las clases)
  const porCarrera = new Map<string, PagoCatedraticoCalculado[]>();
  for (const p of pagos) {
    const carreras = new Set<string>();
    for (const c of p.clases) {
      const car = c.clase.carrera_codigo || "OTRO";
      carreras.add(car);
    }
    for (const car of carreras) {
      if (!porCarrera.has(car)) porCarrera.set(car, []);
      // Para cada carrera, incluir solo el subconjunto de clases de ese catedrático que pertenecen a ella
      const subset: PagoCatedraticoCalculado = {
        ...p,
        clases: p.clases.filter((c) => (c.clase.carrera_codigo || "OTRO") === car),
      };
      subset.totalIngresos = subset.clases.reduce(
        (a, b) => a + b.valorPorClase,
        0,
      );
      subset.totalAPagar = subset.totalIngresos - subset.totalDeducciones;
      if (subset.clases.length > 0) porCarrera.get(car)!.push(subset);
    }
  }

  for (const [car, lista] of porCarrera.entries()) {
    const ws = wb.addWorksheet(car.slice(0, 31));
    escribirEncabezadoHoja(ws, titulo, campus, periodo, car);
    escribirTabla(ws, lista, opciones.semanasAPagar);
    aplicarAnchos(ws);
  }

  const arr = await wb.xlsx.writeBuffer();
  return Buffer.from(arr);
}

function escribirEncabezadoHoja(
  ws: ExcelJS.Worksheet,
  titulo: string,
  campus: string,
  periodo: string,
  sub?: string,
) {
  ws.getCell("B2").value = "UNIVERSIDAD JOSÉ CECILIO DEL VALLE";
  ws.getCell("B2").font = { bold: true, size: 12 };
  ws.getCell("B3").value = `${titulo} ${periodo}`;
  ws.getCell("B3").font = { bold: true };
  ws.getCell("B4").value = campus;
  ws.getCell("B4").font = { bold: true };
  if (sub) {
    ws.getCell("B5").value = sub;
    ws.getCell("B5").font = { italic: true };
  }

  for (let i = 0; i < COLUMNAS.length; i++) {
    const cell = ws.getCell(7, i + 1);
    cell.value = COLUMNAS[i];
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F3A68" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  }
  ws.getRow(7).height = 36;
  ws.views = [{ state: "frozen", ySplit: 7, xSplit: 2 }];
}

function escribirTabla(
  ws: ExcelJS.Worksheet,
  pagos: PagoCatedraticoCalculado[],
  semanas: number,
) {
  let fila = 8;
  let n = 0;

  for (const pago of pagos) {
    const grupoLen = pago.clases.length;
    for (let i = 0; i < grupoLen; i++) {
      const esUltima = i === grupoLen - 1;
      n++;
      escribirFila(ws, fila, n, pago, pago.clases[i], semanas, esUltima);
      fila++;
    }
  }
}

function escribirFila(
  ws: ExcelJS.Worksheet,
  fila: number,
  n: number,
  pago: PagoCatedraticoCalculado,
  pc: PagoClaseCalculado,
  semanas: number,
  esUltima: boolean,
) {
  const c = pc.clase;
  const bloquesPorDia: Record<string, string[]> = {};
  for (const b of c.bloques_horarios) {
    if (!bloquesPorDia[b.dia]) bloquesPorDia[b.dia] = [];
    const inicio = `${String(Math.floor(b.inicio_min / 60)).padStart(2, "0")}:${String(b.inicio_min % 60).padStart(2, "0")}`;
    const fin = `${String(Math.floor(b.fin_min / 60)).padStart(2, "0")}:${String(b.fin_min % 60).padStart(2, "0")}`;
    bloquesPorDia[b.dia].push(`${inicio}-${fin}`);
  }

  const valores: (string | number | "")[] = [
    n,
    pago.catedratico,
    c.asignatura_nombre,
    c.carrera_codigo || "",
    c.codigo,
    c.modalidad || "",
    c.aula_texto,
    c.seccion,
    c.alumnos ?? "",
    pc.horasPorSemana,
    c.horas_asincronicas ?? 0,
    ...DIAS.map((d) => (bloquesPorDia[d] ?? []).join(" | ")),
    "", // TIPO CONTRATACION
    c.observaciones || "",
    c.horas_asincronicas ?? 0,
    0, // VALOR POR PERIODO COMPLETO
    semanas,
    pc.horasPorSemana,
    pc.horasTotales,
    pc.tarifa,
    pc.valorPorClase,
    esUltima ? pago.totalIngresos : "",
    esUltima ? pago.ihss : "",
    esUltima ? pago.ujcv : "",
    esUltima ? pago.embargo : "",
    esUltima ? pago.ach : "",
    esUltima ? pago.totalDeducciones : "",
    esUltima ? pago.totalAPagar : "",
  ];

  for (let i = 0; i < valores.length; i++) {
    const cell = ws.getCell(fila, i + 1);
    cell.value = valores[i];
    cell.alignment = { vertical: "top", wrapText: true };
  }

  if (esUltima) {
    for (const col of [28, 33, 34]) {
      ws.getCell(fila, col).font = { bold: true };
      ws.getCell(fila, col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF3CD" },
      };
    }
  }
}

function aplicarAnchos(ws: ExcelJS.Worksheet) {
  for (let i = 0; i < ANCHOS.length; i++) {
    ws.getColumn(i + 1).width = ANCHOS[i];
  }
}
