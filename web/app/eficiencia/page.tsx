import { cargarDashboard } from "@/lib/dashboard";
import type { MetricaAulaJSON, MetricaDocenteJSON } from "@/lib/dashboard";

export const metadata = {
  title: "Eficiencia — UJCVx",
};

export default async function EficienciaPage() {
  const data = await cargarDashboard();

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Eficiencia</h1>
        <div className="mt-8 rounded border border-amber-300 bg-amber-50 p-6 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            No hay datos cargados todavía
          </p>
          <p className="mt-2 text-zinc-700 dark:text-zinc-400">
            Corre el pipeline para generar el dashboard:
          </p>
          <pre className="mt-3 overflow-x-auto rounded bg-zinc-900 p-3 text-xs text-zinc-100">
            cd proyecto_madrina && python main.py
          </pre>
        </div>
      </main>
    );
  }

  const aulas = [...data.metricas_aulas].sort(
    (a, b) => b.porcentaje_ocupacion - a.porcentaje_ocupacion,
  );
  const docentes = [...data.metricas_docentes].sort(
    (a, b) => b.horas_huecos - a.horas_huecos,
  );

  const ocupacionPromedio =
    aulas.reduce((acc, a) => acc + a.porcentaje_ocupacion, 0) / aulas.length;
  const subutilizadas = aulas.filter((a) => a.porcentaje_ocupacion < 25).length;
  const sobreutilizadas = aulas.filter((a) => a.porcentaje_ocupacion > 80).length;
  const docentesConHuecos = docentes.filter((d) => d.horas_huecos > 4).length;
  const docentesIneficientes = docentes.filter(
    (d) => d.ratio_eficiencia < 70 && d.horas_semanales > 0,
  ).length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight">Eficiencia</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Aulas y docentes — oportunidades de optimización.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta
          label="Ocupación promedio"
          valor={`${ocupacionPromedio.toFixed(1)}%`}
        />
        <Tarjeta
          label="Aulas subutilizadas"
          valor={subutilizadas}
          sub="< 25%"
        />
        <Tarjeta
          label="Docentes con huecos"
          valor={docentesConHuecos}
          sub="> 4 h/sem"
        />
        <Tarjeta
          label="Docentes ineficientes"
          valor={docentesIneficientes}
          sub="< 70% eficiencia"
        />
      </section>

      <section className="mt-12">
        <header className="mb-3 flex items-baseline justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Ocupación por aula</h2>
          <span className="text-sm text-zinc-500">{aulas.length} aulas</span>
        </header>
        <TablaAulas aulas={aulas} />
        <p className="mt-2 text-xs text-zinc-500">
          Jornada de referencia: 7:00–21:00 lun–sáb = 84 h/sem.
        </p>
      </section>

      <section className="mt-12">
        <header className="mb-3 flex items-baseline justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">
            Docentes con más huecos entre clases
          </h2>
          <span className="text-sm text-zinc-500">{docentes.length} docentes</span>
        </header>
        <TablaDocentes docentes={docentes.slice(0, 30)} />
        {docentes.length > 30 && (
          <p className="mt-2 text-xs text-zinc-500">
            Mostrando 30 de {docentes.length}.
          </p>
        )}
      </section>
    </main>
  );
}

function Tarjeta({
  label,
  valor,
  sub,
}: {
  label: string;
  valor: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{valor}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function TablaAulas({ aulas }: { aulas: MetricaAulaJSON[] }) {
  return (
    <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100 text-xs uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-2 text-left">Aula</th>
            <th className="px-4 py-2 text-right">Horas/sem</th>
            <th className="px-4 py-2 text-left">Ocupación</th>
            <th className="px-4 py-2 text-right">Clases</th>
            <th className="px-4 py-2 text-right">Catedráticos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
          {aulas.map((a) => (
            <tr key={a.aula}>
              <td className="px-4 py-2 font-medium">{a.aula}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {a.horas_ocupadas.toFixed(1)}
              </td>
              <td className="px-4 py-2">
                <BarraOcupacion porcentaje={a.porcentaje_ocupacion} />
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{a.n_clases}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {a.n_catedraticos}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarraOcupacion({ porcentaje }: { porcentaje: number }) {
  const color =
    porcentaje < 25
      ? "bg-rose-500"
      : porcentaje > 80
        ? "bg-emerald-500"
        : "bg-sky-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-32 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full ${color}`}
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
      </div>
      <span className="tabular-nums text-xs text-zinc-600 dark:text-zinc-400">
        {porcentaje.toFixed(0)}%
      </span>
    </div>
  );
}

function TablaDocentes({ docentes }: { docentes: MetricaDocenteJSON[] }) {
  return (
    <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100 text-xs uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-2 text-left">Catedrático</th>
            <th className="px-4 py-2 text-right">H/sem</th>
            <th className="px-4 py-2 text-right">Días</th>
            <th className="px-4 py-2 text-right">Huecos</th>
            <th className="px-4 py-2 text-right">Eficiencia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
          {docentes.map((d) => (
            <tr
              key={d.catedratico}
              className={
                d.horas_huecos > 4 || d.ratio_eficiencia < 70
                  ? "bg-rose-50/50 dark:bg-rose-950/10"
                  : ""
              }
            >
              <td className="px-4 py-2 font-medium">{d.catedratico}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {d.horas_semanales.toFixed(1)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{d.n_dias}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {d.horas_huecos.toFixed(1)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {d.ratio_eficiencia.toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
