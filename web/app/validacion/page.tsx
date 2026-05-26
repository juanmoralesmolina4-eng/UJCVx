import { cargarDashboard } from "@/lib/dashboard";
import type { ProblemaJSON } from "@/lib/dashboard";
import { BotonResolver } from "./boton-resolver";

export const metadata = {
  title: "Validación — UJCVx",
};

const ETIQUETAS: Record<string, string> = {
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

const COLOR_SEVERIDAD: Record<string, string> = {
  alta: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  baja: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export default async function ValidacionPage({
  searchParams,
}: {
  searchParams: Promise<{ resueltos?: string }>;
}) {
  const { resueltos } = await searchParams;
  const mostrarResueltos = resueltos === "true";

  const data = await cargarDashboard();
  if (!data) return <SinDatos />;

  const problemasFiltrados = mostrarResueltos
    ? data.problemas
    : data.problemas.filter((p) => !p.resuelto);

  const grupos = agruparPorTipo(problemasFiltrados);
  const totalActivos = data.problemas.filter((p) => !p.resuelto).length;
  const totalResueltos = data.problemas.filter((p) => p.resuelto).length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-3xl font-semibold tracking-tight">Validación</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {totalActivos} problemas pendientes y {totalResueltos} resueltos en {data.totales.clases} secciones del último análisis.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Generado el {new Date(data.generado_at).toLocaleString("es-HN")}
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Tarjeta label="Secciones" valor={data.totales.clases} />
        <Tarjeta label="Catedráticos" valor={data.totales.catedraticos} />
        <Tarjeta label="Aulas en uso" valor={data.totales.aulas} />
      </section>

      <section className="mt-8 flex items-center gap-3 text-sm">
        <a
          href="/validacion"
          className={`rounded px-3 py-1.5 ${!mostrarResueltos ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
        >
          Pendientes ({totalActivos})
        </a>
        <a
          href="/validacion?resueltos=true"
          className={`rounded px-3 py-1.5 ${mostrarResueltos ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
        >
          Todos ({data.problemas.length})
        </a>
      </section>

      <section className="mt-6 space-y-8">
        {grupos.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            {mostrarResueltos ? "No hay problemas registrados." : "No hay problemas pendientes."}
          </p>
        ) : (
          grupos.map(([tipo, problemas]) => (
            <GrupoProblemas
              key={tipo}
              titulo={ETIQUETAS[tipo] ?? tipo}
              problemas={problemas}
            />
          ))
        )}
      </section>
    </main>
  );
}

function agruparPorTipo(problemas: ProblemaJSON[]): [string, ProblemaJSON[]][] {
  const m = new Map<string, ProblemaJSON[]>();
  for (const p of problemas) {
    if (!m.has(p.tipo)) m.set(p.tipo, []);
    m.get(p.tipo)!.push(p);
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
}

function GrupoProblemas({
  titulo,
  problemas,
}: {
  titulo: string;
  problemas: ProblemaJSON[];
}) {
  return (
    <article>
      <header className="mb-3 flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <span className="text-sm text-zinc-500">{problemas.length}</span>
      </header>
      <ul className="space-y-2">
        {problemas.map((p, i) => (
          <li
            key={p.id ?? i}
            className={`rounded border p-3 text-sm ${
              p.resuelto
                ? "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs uppercase tracking-wider ${COLOR_SEVERIDAD[p.severidad]}`}
              >
                {p.severidad}
              </span>
              <div className="flex-1">
                <p
                  className={`text-zinc-800 dark:text-zinc-200 ${p.resuelto ? "line-through" : ""}`}
                >
                  {p.descripcion}
                </p>
                {p.referencias.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {p.referencias
                      .map((r) => `${r.hoja} · fila ${r.fila}`)
                      .join(" · ")}
                  </p>
                )}
                {p.resuelto && p.nota_resolucion && (
                  <p className="mt-1 text-xs italic text-emerald-700 dark:text-emerald-300">
                    Nota: {p.nota_resolucion}
                  </p>
                )}
              </div>
              {p.id && (
                <BotonResolver
                  id={p.id}
                  resuelto={p.resuelto ?? false}
                  notaActual={p.nota_resolucion ?? ""}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Tarjeta({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{valor}</p>
    </div>
  );
}

function SinDatos() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Validación</h1>
      <div className="mt-8 rounded border border-amber-300 bg-amber-50 p-6 text-sm dark:border-amber-900 dark:bg-amber-950/30">
        <p className="font-medium text-amber-800 dark:text-amber-200">
          Aún no se ha cargado ninguna programación
        </p>
        <p className="mt-2 text-zinc-700 dark:text-zinc-400">
          Cargue el archivo Excel desde la sección{" "}
          <a href="/cargar" className="underline">Cargar</a> para iniciar el análisis.
        </p>
      </div>
    </main>
  );
}
