import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const EXTENSIONES: Record<string, string> = {
  validacion: "xlsx",
  normalizado: "xlsx",
  pago: "xlsx",
  metricas: "xlsx",
  csv: "csv",
};

const NOMBRES_DESCARGA: Record<string, string> = {
  validacion: "Reporte_validacion.xlsx",
  normalizado: "Programacion_normalizada.xlsx",
  pago: "Pago_RRHH_borrador.xlsx",
  metricas: "Reporte_metricas.xlsx",
  csv: "Programacion_normalizada.csv",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ importacionId: string; archivo: string }> },
) {
  const { importacionId, archivo } = await ctx.params;
  const ext = EXTENSIONES[archivo];
  if (!ext) {
    return NextResponse.json({ error: "Tipo de archivo desconocido" }, { status: 404 });
  }

  const objectPath = `outputs/${importacionId}/${archivo}.${ext}`;
  const sb = createSupabaseAdminClient();

  const { data, error } = await sb.storage
    .from("uploads")
    .createSignedUrl(objectPath, 60, {
      download: NOMBRES_DESCARGA[archivo],
    });

  if (error || !data) {
    return NextResponse.json(
      { error: `No se pudo generar la URL: ${error?.message ?? "sin detalle"}` },
      { status: 404 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
