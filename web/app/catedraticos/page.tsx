import Link from "next/link";

import { agregarPorCatedratico, listarClasesUltimoPeriodo } from "@/lib/data";

export const metadata = {
  title: "Catedráticos — UJCVx",
};

export default async function CatedraticosPage() {
  const clases = await listarClasesUltimoPeriodo();
  const docentes = agregarPorCatedratico(clases);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight">Catedráticos</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {docentes.length} catedráticos en el período actual. Click en uno
          para ver su horario.
        </p>
      </header>

      {docentes.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
          No hay catedráticos cargados.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-xs uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 text-left">Catedrático</th>
                <th className="px-4 py-2 text-right">Clases</th>
                <th className="px-4 py-2 text-right">Asignaturas</th>
                <th className="px-4 py-2 text-right">H/sem</th>
                <th className="px-4 py-2 text-left">Carreras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {docentes.map((d) => (
                <tr
                  key={d.nombre}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/catedraticos/${encodeURIComponent(d.nombre)}`}
                      className="font-medium hover:underline"
                    >
                      {d.nombre}
                    </Link>
                    {d.es_nuevo && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        Nuevo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {d.n_clases}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {d.asignaturas_unicas}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {d.horas_semanales.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {d.carreras.join(", ")}
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
