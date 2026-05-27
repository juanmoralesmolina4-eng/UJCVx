/**
 * Cálculo de pagos docentes — espejo de proyecto_madrina/exportar/rrhh.py.
 *
 * Fórmula:
 *   horas_totales   = horas_por_semana × semanas_a_pagar
 *   valor_por_clase = horas_totales × tarifa
 *   ingresos        = suma(valor_por_clase) por catedrático
 *   deducciones     = ihss + ujcv + embargo + ach
 *   a_pagar         = ingresos − deducciones
 */
import type { ClaseDB } from "@/lib/data";

export interface ParametrosPago {
  semanasAPagar: number;
  tarifaPorHoraDefault: number;
  /** Tarifas específicas por catedrático (nombre normalizado → L/hora). */
  tarifasPorCatedratico?: Record<string, number>;
  /** Deducciones por catedrático. */
  deduccionesPorCatedratico?: Record<
    string,
    { ihss?: number; ujcv?: number; embargo?: number; ach?: number }
  >;
}

export interface PagoClaseCalculado {
  clase: ClaseDB;
  horasPorSemana: number;
  horasTotales: number;
  tarifa: number;
  valorPorClase: number;
}

export interface PagoCatedraticoCalculado {
  catedratico: string;
  clases: PagoClaseCalculado[];
  totalIngresos: number;
  ihss: number;
  ujcv: number;
  embargo: number;
  ach: number;
  totalDeducciones: number;
  totalAPagar: number;
}

export function calcularPagos(
  clases: ClaseDB[],
  p: ParametrosPago,
): PagoCatedraticoCalculado[] {
  const porCated = new Map<string, ClaseDB[]>();
  for (const c of clases) {
    const cated = c.catedratico_nombre || "SIN ASIGNAR";
    if (!porCated.has(cated)) porCated.set(cated, []);
    porCated.get(cated)!.push(c);
  }

  const tarifas = p.tarifasPorCatedratico ?? {};
  const deds = p.deduccionesPorCatedratico ?? {};

  return [...porCated.entries()]
    .map(([cated, grupo]): PagoCatedraticoCalculado => {
      const tarifa = tarifas[cated] ?? p.tarifaPorHoraDefault;
      const pagosClase = grupo.map((c): PagoClaseCalculado => {
        // Si no hay presenciales, usar el total. Si no hay total, calcular
        // a partir de los bloques reales del horario. Sin esto, las clases
        // sin `horas_presenciales` declaradas pagarían 0.
        const horas = c.horas_presenciales ?? c.horas_totales ?? 0;
        const horasTotales = horas * p.semanasAPagar;
        return {
          clase: c,
          horasPorSemana: horas,
          horasTotales,
          tarifa,
          valorPorClase: horasTotales * tarifa,
        };
      });

      const ingresos = pagosClase.reduce((a, b) => a + b.valorPorClase, 0);
      const d = deds[cated] ?? {};
      const ihss = d.ihss ?? 0;
      const ujcv = d.ujcv ?? 0;
      const embargo = d.embargo ?? 0;
      const ach = d.ach ?? 0;
      const totalDed = ihss + ujcv + embargo + ach;

      return {
        catedratico: cated,
        clases: pagosClase,
        totalIngresos: ingresos,
        ihss,
        ujcv,
        embargo,
        ach,
        totalDeducciones: totalDed,
        totalAPagar: ingresos - totalDed,
      };
    })
    .sort((a, b) => a.catedratico.localeCompare(b.catedratico));
}

export function totalesGlobales(pagos: PagoCatedraticoCalculado[]) {
  return {
    nCatedraticos: pagos.length,
    nClases: pagos.reduce((a, b) => a + b.clases.length, 0),
    totalIngresos: pagos.reduce((a, b) => a + b.totalIngresos, 0),
    totalDeducciones: pagos.reduce((a, b) => a + b.totalDeducciones, 0),
    totalAPagar: pagos.reduce((a, b) => a + b.totalAPagar, 0),
  };
}
