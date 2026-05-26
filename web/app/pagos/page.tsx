import { listarClasesUltimoPeriodo } from "@/lib/data";
import { calcularPagos, totalesGlobales } from "@/lib/pago/calculo";
import { FormularioPago } from "./formulario-pago";

export const metadata = {
  title: "Generar pago — UJCVx",
};

const FMT_LPS = new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL",
  maximumFractionDigits: 0,
});

export default async function PagosPage() {
  const clases = await listarClasesUltimoPeriodo();

  // Vista previa con defaults (4 semanas, 230 L/h)
  const preview = calcularPagos(clases, {
    semanasAPagar: 4,
    tarifaPorHoraDefault: 230,
  });
  const totales = totalesGlobales(preview);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight">
          Generar archivo de pago
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Calcula el pago docente en el formato exacto que pide Recursos
          Humanos y lo descarga como Excel.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-4">
        <Tarjeta label="Catedráticos" valor={totales.nCatedraticos.toString()} />
        <Tarjeta label="Clases" valor={totales.nClases.toString()} />
        <Tarjeta
          label="Ingresos defaults"
          valor={FMT_LPS.format(totales.totalIngresos)}
          sub="4 semanas × 230 L"
        />
        <Tarjeta
          label="A pagar"
          valor={FMT_LPS.format(totales.totalAPagar)}
          sub="sin deducciones"
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold">Parámetros y descarga</h2>
        <FormularioPago />
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-xl font-semibold">
          Vista previa por catedrático (defaults)
        </h2>
        <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-xs uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 text-left">Catedrático</th>
                <th className="px-4 py-2 text-right">Clases</th>
                <th className="px-4 py-2 text-right">H/sem</th>
                <th className="px-4 py-2 text-right">Total ingresos</th>
                <th className="px-4 py-2 text-right">A pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {preview.map((p) => {
                const hSem = p.clases.reduce(
                  (a, b) => a + b.horasPorSemana,
                  0,
                );
                return (
                  <tr key={p.catedratico}>
                    <td className="px-4 py-2 font-medium">{p.catedratico}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {p.clases.length}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{hSem}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {FMT_LPS.format(p.totalIngresos)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {FMT_LPS.format(p.totalAPagar)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
  valor: string;
  sub?: string;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{valor}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
