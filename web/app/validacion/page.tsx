import Link from "next/link";
import { Upload } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          Validación
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aún no se ha cargado ninguna programación.
            </p>
            <Link
              href="/cargar"
              className="inline-flex items-center gap-2 rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              <Upload className="h-4 w-4" />
              Cargar programación
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const problemasFiltrados = mostrarResueltos
    ? data.problemas
    : data.problemas.filter((p) => !p.resuelto);
  const grupos = agruparPorTipo(problemasFiltrados);
  const totalActivos = data.problemas.filter((p) => !p.resuelto).length;
  const totalResueltos = data.problemas.filter((p) => p.resuelto).length;

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Validación</h1>
        <p className="text-sm text-muted-foreground">
          {totalActivos} pendientes, {totalResueltos} resueltos.
        </p>
      </header>

      <Tabs value={mostrarResueltos ? "todos" : "pendientes"} className="mb-6">
        <TabsList>
          <TabsTrigger value="pendientes" asChild>
            <Link href="/validacion">Pendientes ({totalActivos})</Link>
          </TabsTrigger>
          <TabsTrigger value="todos" asChild>
            <Link href="/validacion?resueltos=true">
              Todos ({data.problemas.length})
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="space-y-6">
        {grupos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {mostrarResueltos
                ? "No hay problemas registrados."
                : "No hay problemas pendientes."}
            </CardContent>
          </Card>
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
    </div>
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
    <Card>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        <Badge variant="outline">{problemas.length}</Badge>
      </div>
      <ul className="divide-y">
        {problemas.map((p, i) => (
          <li
            key={p.id ?? i}
            className={`flex items-start gap-3 p-4 text-sm ${
              p.resuelto ? "bg-muted/30 opacity-60" : ""
            }`}
          >
            <Badge
              variant="outline"
              className={`shrink-0 ${COLOR_SEVERIDAD[p.severidad]}`}
            >
              {p.severidad}
            </Badge>
            <div className="flex-1 space-y-1">
              <p className={p.resuelto ? "line-through" : ""}>
                {p.descripcion}
              </p>
              {p.referencias.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {p.referencias
                    .map((r) => `${r.hoja} · fila ${r.fila}`)
                    .join(" · ")}
                </p>
              )}
              {p.resuelto && p.nota_resolucion && (
                <p className="text-xs italic text-emerald-700 dark:text-emerald-300">
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
          </li>
        ))}
      </ul>
    </Card>
  );
}
