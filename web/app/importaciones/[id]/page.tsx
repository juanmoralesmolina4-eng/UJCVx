import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Importación — UJCVx",
};

const COLOR_STATUS: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  procesando: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  completada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  fallida: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
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
  { key: "validacion", label: "Reporte de validación", desc: "Excel con todos los problemas agrupados por tipo." },
  { key: "normalizado", label: "Programación normalizada", desc: "Misma data, limpia y verificable." },
  { key: "csv", label: "CSV exportable", desc: "Para importar a cualquier otra app." },
  { key: "pago", label: "Archivo de pago RRHH", desc: "Formato exacto de COMAYAGUA, listo para RRHH." },
  { key: "metricas", label: "Reporte de métricas", desc: "Eficiencia de aulas y docentes." },
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
    .select("id, tipo, archivo, total_filas, status, error, created_at, periodo_id")
    .eq("id", id)
    .maybeSingle();

  if (!imp) {
    notFound();
  }

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
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <Link
          href="/importaciones"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Historial de cargas
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Importación{" "}
          <code className="text-2xl">{importacion.id.slice(0, 8)}</code>
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span
            className={`rounded px-2 py-0.5 text-xs uppercase tracking-wider ${COLOR_STATUS[importacion.status]}`}
          >
            {importacion.status}
          </span>
          <span>
            Subido el{" "}
            {new Date(importacion.created_at).toLocaleString("es-HN")}
          </span>
        </div>
        <p className="mt-2 break-all text-xs text-zinc-500">
          Archivo: {importacion.archivo}
        </p>
        {importacion.error && (
          <p className="mt-2 text-sm text-rose-600">{importacion.error}</p>
        )}
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tarjeta label="Filas" valor={importacion.total_filas ?? "—"} />
        <Tarjeta label="Clases analizadas" valor={corrida?.total_clases ?? "—"} />
        <Tarjeta label="Problemas detectados" valor={corrida?.total_problemas ?? "—"} />
      </section>

      <section className="mt-10">
        <h2 className="border-b border-zinc-200 pb-2 text-xl font-semibold dark:border-zinc-800">
          Archivos generados
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {DESCARGAS.map((d) => {
            const disponible = archivosDisponibles.has(d.key);
            return (
              <div
                key={d.key}
                className={`rounded border p-4 text-sm ${
                  disponible
                    ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                    : "border-zinc-100 bg-zinc-50 opacity-50 dark:border-zinc-900 dark:bg-zinc-950"
                }`}
              >
                <p className="font-medium">{d.label}</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {d.desc}
                </p>
                {disponible ? (
                  <a
                    href={`/api/descargar/${importacion.id}/${d.key}`}
                    className="mt-3 inline-block rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    Descargar
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-zinc-500">No disponible</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {corrida?.resumen && Object.keys(corrida.resumen).length > 0 && (
        <section className="mt-10">
          <h2 className="border-b border-zinc-200 pb-2 text-xl font-semibold dark:border-zinc-800">
            Resumen de problemas
          </h2>
          <ul className="mt-4 space-y-1 text-sm">
            {Object.entries(corrida.resumen).map(([tipo, n]) => (
              <li
                key={tipo}
                className="flex justify-between border-b border-zinc-100 py-1 dark:border-zinc-800"
              >
                <span>{ETIQUETAS_PROBLEMA[tipo] ?? tipo}</span>
                <span className="tabular-nums font-medium">{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            Ver detalle en{" "}
            <Link href="/validacion" className="underline">
              Validación
            </Link>
            .
          </p>
        </section>
      )}
    </main>
  );
}

function Tarjeta({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{valor}</p>
    </div>
  );
}
