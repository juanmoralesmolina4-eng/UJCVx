import Link from "next/link";
import { notFound } from "next/navigation";

import {
  HorarioSemanal,
  colorPorClave,
} from "@/components/horario-semanal";
import { clasesDeAula, listarClasesUltimoPeriodo } from "@/lib/data";

export const metadata = {
  title: "Aula — UJCVx",
};

const HORAS_JORNADA_SEMANA = (21 - 7) * 6;

export default async function AulaDetalle({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo: codigoRaw } = await params;
  const codigo = decodeURIComponent(codigoRaw);

  const todasLasClases = await listarClasesUltimoPeriodo();
  const clases = clasesDeAula(todasLasClases, codigo);

  if (clases.length === 0) {
    notFound();
  }

  const bloques = clases.flatMap((c) =>
    c.bloques_horarios.map((b) => ({
      dia: b.dia,
      inicioMin: b.inicio_min,
      finMin: b.fin_min,
      titulo: c.asignatura_nombre,
      subtitulo: `${c.catedratico_nombre} · ${c.seccion}`,
      color: colorPorClave(c.catedratico_nombre),
    })),
  );

  const horasSemanales = bloques.reduce(
    (acc, b) => acc + (b.finMin - b.inicioMin) / 60,
    0,
  );
  const ocupacion = (100 * horasSemanales) / HORAS_JORNADA_SEMANA;
  const catedraticos = new Set(clases.map((c) => c.catedratico_nombre));
  const esVirtual = codigo.toUpperCase().includes("VIRTUAL");

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <Link
          href="/aulas"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Aulas
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Aula {codigo}
        </h1>
        {esVirtual && (
          <p className="mt-2 text-sm text-zinc-500">
            Espacio virtual — no aplica ocupación física.
          </p>
        )}
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-4">
        <Tarjeta label="Clases" valor={clases.length} />
        <Tarjeta label="Horas/sem" valor={horasSemanales.toFixed(1)} />
        <Tarjeta label="Catedráticos" valor={catedraticos.size} />
        {!esVirtual && (
          <Tarjeta label="Ocupación" valor={`${ocupacion.toFixed(0)}%`} />
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold">Horario semanal</h2>
        <HorarioSemanal bloques={bloques} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold">Clases en esta aula</h2>
        <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-xs uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 text-left">Código</th>
                <th className="px-4 py-2 text-left">Asignatura</th>
                <th className="px-4 py-2 text-left">Sección</th>
                <th className="px-4 py-2 text-left">Catedrático</th>
                <th className="px-4 py-2 text-right">Alumnos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {clases.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-mono text-xs">{c.codigo}</td>
                  <td className="px-4 py-2">{c.asignatura_nombre}</td>
                  <td className="px-4 py-2">{c.seccion}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/catedraticos/${encodeURIComponent(c.catedratico_nombre)}`}
                      className="hover:underline"
                    >
                      {c.catedratico_nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {c.alumnos ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
