import Link from "next/link";

import { agregarPorAula, listarClasesUltimoPeriodo } from "@/lib/data";

export const metadata = {
  title: "Aulas — UJCVx",
};

const HORAS_JORNADA_SEMANA = (21 - 7) * 6;

export default async function AulasPage() {
  const clases = await listarClasesUltimoPeriodo();
  const aulas = agregarPorAula(clases);

  const fisicas = aulas.filter((a) => !a.es_virtual);
  const virtuales = aulas.filter((a) => a.es_virtual);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight">Aulas</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {fisicas.length} aulas físicas y {virtuales.length} espacios virtuales
          en uso. Seleccione una para ver su horario semanal.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Aulas físicas</h2>
        <Tabla aulas={fisicas} mostrarOcupacion />
      </section>

      {virtuales.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Espacios virtuales</h2>
          <Tabla aulas={virtuales} />
        </section>
      )}
    </main>
  );
}

interface AulaRow {
  codigo: string;
  n_clases: number;
  horas_semanales: number;
  catedraticos: string[];
}

function Tabla({
  aulas,
  mostrarOcupacion = false,
}: {
  aulas: AulaRow[];
  mostrarOcupacion?: boolean;
}) {
  if (aulas.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Sin registros.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100 text-xs uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-2 text-left">Aula</th>
            <th className="px-4 py-2 text-right">Clases</th>
            <th className="px-4 py-2 text-right">H/sem</th>
            {mostrarOcupacion && (
              <th className="px-4 py-2 text-left">Ocupación</th>
            )}
            <th className="px-4 py-2 text-right">Catedráticos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
          {aulas.map((a) => {
            const ocupacion = (100 * a.horas_semanales) / HORAS_JORNADA_SEMANA;
            const color =
              ocupacion < 25
                ? "bg-rose-500"
                : ocupacion > 80
                  ? "bg-emerald-500"
                  : "bg-sky-500";
            return (
              <tr
                key={a.codigo}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/aulas/${encodeURIComponent(a.codigo)}`}
                    className="font-medium hover:underline"
                  >
                    {a.codigo}
                  </Link>
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {a.n_clases}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {a.horas_semanales.toFixed(1)}
                </td>
                {mostrarOcupacion && (
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className={`h-full ${color}`}
                          style={{ width: `${Math.min(ocupacion, 100)}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-xs text-zinc-600 dark:text-zinc-400">
                        {ocupacion.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                )}
                <td className="px-4 py-2 text-right tabular-nums">
                  {a.catedraticos.length}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
