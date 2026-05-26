import { NextResponse } from "next/server";

import { listarClasesUltimoPeriodo } from "@/lib/data";
import { calcularPagos } from "@/lib/pago/calculo";
import { generarExcelPago } from "@/lib/pago/excel";

const TITULOS_POR_NUMERO: Record<number, string> = {
  1: "PRIMER PAGO DOCENTE",
  2: "SEGUNDO PAGO DOCENTE",
  3: "TERCER PAGO DOCENTE",
  4: "CUARTO PAGO DOCENTE",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const numero = Number(url.searchParams.get("numero") ?? 1);
  const semanas = Number(url.searchParams.get("semanas") ?? 4);
  const tarifa = Number(url.searchParams.get("tarifa") ?? 230);
  const campus = url.searchParams.get("campus") ?? "TEGUCIGALPA";
  const periodo = url.searchParams.get("periodo") ?? "II PAC 2026";

  if (!Number.isFinite(semanas) || semanas < 1 || semanas > 20) {
    return NextResponse.json({ error: "Semanas inválidas" }, { status: 400 });
  }
  if (!Number.isFinite(tarifa) || tarifa < 0) {
    return NextResponse.json({ error: "Tarifa inválida" }, { status: 400 });
  }

  const clases = await listarClasesUltimoPeriodo();
  if (clases.length === 0) {
    return NextResponse.json(
      { error: "No hay clases cargadas" },
      { status: 400 },
    );
  }

  const pagos = calcularPagos(clases, {
    semanasAPagar: semanas,
    tarifaPorHoraDefault: tarifa,
  });

  const buffer = await generarExcelPago(pagos, {
    titulo: TITULOS_POR_NUMERO[numero] ?? "PAGO DOCENTE",
    campusNombre: campus,
    periodo,
    semanasAPagar: semanas,
  });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pago-${numero}-${campus.toLowerCase()}.xlsx"`,
    },
  });
}
