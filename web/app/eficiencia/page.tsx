import { Upload } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cargarDashboard } from "@/lib/dashboard";
import type { MetricaAulaJSON, MetricaDocenteJSON } from "@/lib/dashboard";

export const metadata = {
  title: "Eficiencia — UJCVx",
};

export default async function EficienciaPage() {
  const data = await cargarDashboard();

  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          Eficiencia
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Cargue un archivo Excel para ver las métricas.
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

  const aulas = [...data.metricas_aulas].sort(
    (a, b) => b.porcentaje_ocupacion - a.porcentaje_ocupacion,
  );
  const docentes = [...data.metricas_docentes].sort(
    (a, b) => b.horas_huecos - a.horas_huecos,
  );

  const ocupacionPromedio =
    aulas.reduce((acc, a) => acc + a.porcentaje_ocupacion, 0) / aulas.length;
  const subutilizadas = aulas.filter((a) => a.porcentaje_ocupacion < 25).length;
  const docentesConHuecos = docentes.filter((d) => d.horas_huecos > 4).length;
  const docentesIneficientes = docentes.filter(
    (d) => d.ratio_eficiencia < 70 && d.horas_semanales > 0,
  ).length;

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Eficiencia</h1>
        <p className="text-sm text-muted-foreground">
          Uso de aulas y carga docente.
        </p>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Ocupación promedio"
          valor={`${ocupacionPromedio.toFixed(1)}%`}
        />
        <Kpi label="Aulas subutilizadas" valor={subutilizadas} sub="< 25%" />
        <Kpi
          label="Docentes con huecos"
          valor={docentesConHuecos}
          sub="> 4 h/sem"
        />
        <Kpi
          label="Docentes ineficientes"
          valor={docentesIneficientes}
          sub="< 70% eficiencia"
        />
      </section>

      <section className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ocupación por aula</CardTitle>
          </CardHeader>
          <CardContent>
            <TablaAulas aulas={aulas} />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Docentes con más huecos entre clases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TablaDocentes docentes={docentes.slice(0, 30)} />
            {docentes.length > 30 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Mostrando 30 de {docentes.length}.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Kpi({
  label,
  valor,
  sub,
}: {
  label: string;
  valor: string | number;
  sub?: string;
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
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function TablaAulas({ aulas }: { aulas: MetricaAulaJSON[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Aula</TableHead>
          <TableHead className="text-right">Horas/sem</TableHead>
          <TableHead>Ocupación</TableHead>
          <TableHead className="text-right">Clases</TableHead>
          <TableHead className="text-right">Catedráticos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aulas.map((a) => {
          const color =
            a.porcentaje_ocupacion < 25
              ? "bg-rose-500"
              : a.porcentaje_ocupacion > 80
                ? "bg-emerald-500"
                : "bg-sky-500";
          return (
            <TableRow key={a.aula}>
              <TableCell className="font-medium">{a.aula}</TableCell>
              <TableCell className="text-right tabular-nums">
                {a.horas_ocupadas.toFixed(1)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded bg-muted">
                    <div
                      className={`h-full ${color}`}
                      style={{ width: `${Math.min(a.porcentaje_ocupacion, 100)}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {a.porcentaje_ocupacion.toFixed(0)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {a.n_clases}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {a.n_catedraticos}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function TablaDocentes({ docentes }: { docentes: MetricaDocenteJSON[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Catedrático</TableHead>
          <TableHead className="text-right">H/sem</TableHead>
          <TableHead className="text-right">Días</TableHead>
          <TableHead className="text-right">Huecos</TableHead>
          <TableHead className="text-right">Eficiencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {docentes.map((d) => (
          <TableRow
            key={d.catedratico}
            className={
              d.horas_huecos > 4 || d.ratio_eficiencia < 70
                ? "bg-rose-50/50 dark:bg-rose-950/10"
                : ""
            }
          >
            <TableCell className="font-medium">{d.catedratico}</TableCell>
            <TableCell className="text-right tabular-nums">
              {d.horas_semanales.toFixed(1)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {d.n_dias}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {d.horas_huecos.toFixed(1)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {d.ratio_eficiencia.toFixed(0)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
