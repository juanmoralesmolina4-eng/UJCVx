import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Importación — UJCVx",
};

const COLOR_STATUS: Record<string, string> = {
  pendiente:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  procesando:
    "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  completada:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  fallida:
    "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

const ETIQUETAS_PROBLEMA: Record<string, string> = {
  consolidacion_inconsistente: "Consolidación inconsistente",
  duplicado: "Duplicados",
  solape_aula: "Solapes de aula",
  solape_catedratico: "Solapes de catedrático",
  horas_inconsistentes: "Horas inconsistentes",
  horario_sospechoso: "Horarios sospechosos",
  sobrecarga_docente: "Sobrecarga docente",
  subutilizacion_docente: "Subutilización docente",
  seccion_grande: "Secciones grandes",
};

const DESCARGAS = [
  { key: "validacion", label: "Reporte de validación", desc: "Problemas agrupados por tipo" },
  { key: "normalizado", label: "Programación normalizada", desc: "Datos limpios verificables" },
  { key: "csv", label: "CSV exportable", desc: "Importable a otras aplicaciones" },
  { key: "pago", label: "Archivo de pago", desc: "Formato Recursos Humanos" },
  { key: "metricas", label: "Reporte de métricas", desc: "Eficiencia de aulas y docentes" },
] as const;

interface ImportacionRow {
  id: string;
  tipo: string;
  archivo: string;
  total_filas: number | null;
  status: keyof typeof COLOR_STATUS;
  error: string | null;
  created_at: string;
  periodo_id: string;
}

export default async function ImportacionDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = createSupabaseAdminClient();

  const { data: imp } = await sb
    .from("importaciones")
    .select(
      "id, tipo, archivo, total_filas, status, error, created_at, periodo_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!imp) notFound();

  const importacion = imp as ImportacionRow;

  const { data: corridas } = await sb
    .from("corridas_validacion")
    .select("id, total_clases, total_problemas, resumen")
    .eq("periodo_id", importacion.periodo_id)
    .order("created_at", { ascending: false })
    .limit(1);

  const corrida = corridas?.[0] as
    | {
        id: string;
        total_clases: number | null;
        total_problemas: number | null;
        resumen: Record<string, number> | null;
      }
    | undefined;

  const { data: filesData } = await sb.storage
    .from("uploads")
    .list(`outputs/${importacion.id}`);

  const archivosDisponibles = new Set(
    (filesData ?? []).map((f) => f.name.split(".")[0]),
  );

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/importaciones"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Historial
      </Link>

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Importación{" "}
            <code className="text-xl">{importacion.id.slice(0, 8)}</code>
          </h1>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            <FileSpreadsheet className="mr-1 inline h-3 w-3" />
            {importacion.archivo}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(importacion.created_at).toLocaleString("es-HN")}
          </p>
        </div>
        <Badge variant="outline" className={COLOR_STATUS[importacion.status]}>
          {importacion.status}
        </Badge>
      </header>

      {importacion.error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">
            {importacion.error}
          </CardContent>
        </Card>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Filas" valor={importacion.total_filas ?? "—"} />
        <Kpi
          label="Clases analizadas"
          valor={corrida?.total_clases ?? "—"}
        />
        <Kpi
          label="Problemas detectados"
          valor={corrida?.total_problemas ?? "—"}
        />
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium">Archivos generados</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {DESCARGAS.map((d) => {
            const disponible = archivosDisponibles.has(d.key);
            return (
              <Card
                key={d.key}
                className={disponible ? "" : "opacity-50"}
              >
                <CardContent className="flex items-start justify-between gap-3 pt-6">
                  <div>
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.desc}
                    </p>
                  </div>
                  {disponible ? (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`/api/descargar/${importacion.id}/${d.key}`}
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Descargar
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No disponible
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {corrida?.resumen && Object.keys(corrida.resumen).length > 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen de problemas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {Object.entries(corrida.resumen).map(([tipo, n]) => (
                  <li
                    key={tipo}
                    className="flex justify-between border-b border-border/50 py-2 last:border-0"
                  >
                    <span>{ETIQUETAS_PROBLEMA[tipo] ?? tipo}</span>
                    <span className="tabular-nums font-medium">{n}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/validacion"
                className="mt-4 inline-block text-sm text-foreground hover:underline"
              >
                Ver detalle de problemas →
              </Link>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function Kpi({
  label,
  valor,
}: {
  label: string;
  valor: string | number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{valor}</p>
      </CardContent>
    </Card>
  );
}
