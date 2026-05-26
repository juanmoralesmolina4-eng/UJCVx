import Link from "next/link";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Historial de cargas — UJCVx",
};

interface ImportacionRow {
  id: string;
  tipo: string;
  archivo: string;
  total_filas: number | null;
  status: "pendiente" | "procesando" | "completada" | "fallida";
  error: string | null;
  created_at: string;
  procesada_at: string | null;
}

const COLOR_STATUS: Record<ImportacionRow["status"], string> = {
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  procesando: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  completada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  fallida: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export default async function ImportacionesPage() {
  const sb = createSupabaseAdminClient();

  const { data, error } = await sb
    .from("importaciones")
    .select("id, tipo, archivo, total_filas, status, error, created_at, procesada_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const importaciones = (data ?? []) as ImportacionRow[];

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight">
          Historial de cargas
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Registro completo de las importaciones realizadas con su estado
          de procesamiento.
        </p>
      </header>

      {error && (
        <div className="mt-8 rounded border border-rose-300 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
          <p className="font-medium text-rose-700 dark:text-rose-300">
            Error al consultar
          </p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">{error.message}</p>
        </div>
      )}

      {!error && importaciones.length === 0 && (
        <div className="mt-8 rounded border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Aún no se ha registrado ninguna importación. Cargue un archivo Excel
          desde la sección <a href="/cargar" className="underline">Cargar</a>.
        </div>
      )}

      {importaciones.length > 0 && (
        <div className="mt-8 overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-xs uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Archivo</th>
                <th className="px-4 py-2 text-right">Filas</th>
                <th className="px-4 py-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {importaciones.map((imp) => (
                <tr
                  key={imp.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <td className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                    <Link
                      href={`/importaciones/${imp.id}`}
                      className="block px-4 py-2"
                    >
                      {new Date(imp.created_at).toLocaleString("es-HN")}
                    </Link>
                  </td>
                  <td className="uppercase text-xs text-zinc-500">
                    <Link
                      href={`/importaciones/${imp.id}`}
                      className="block px-4 py-2"
                    >
                      {imp.tipo}
                    </Link>
                  </td>
                  <td className="break-all text-xs">
                    <Link
                      href={`/importaciones/${imp.id}`}
                      className="block px-4 py-2"
                    >
                      {imp.archivo}
                    </Link>
                  </td>
                  <td className="text-right tabular-nums">
                    <Link
                      href={`/importaciones/${imp.id}`}
                      className="block px-4 py-2"
                    >
                      {imp.total_filas ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/importaciones/${imp.id}`} className="block">
                      <span
                        className={`rounded px-2 py-0.5 text-xs uppercase tracking-wider ${COLOR_STATUS[imp.status]}`}
                      >
                        {imp.status}
                      </span>
                      {imp.error && (
                        <p className="mt-1 text-xs text-rose-600">
                          {imp.error}
                        </p>
                      )}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
