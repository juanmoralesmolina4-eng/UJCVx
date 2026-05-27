import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  if (clases.length === 0) notFound();

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
    <div className="p-6 lg:p-8">
      <Link
        href="/aulas"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Aulas
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Aula {codigo}
        </h1>
        {esVirtual && (
          <p className="mt-1 text-sm text-muted-foreground">
            Espacio virtual — no aplica ocupación física.
          </p>
        )}
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-4">
        <Kpi label="Clases" valor={clases.length} />
        <Kpi label="Horas/sem" valor={horasSemanales.toFixed(1)} />
        <Kpi label="Catedráticos" valor={catedraticos.size} />
        {!esVirtual && (
          <Kpi label="Ocupación" valor={`${ocupacion.toFixed(0)}%`} />
        )}
      </section>

      <section className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horario semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <HorarioSemanal bloques={bloques} />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clases en esta aula</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Asignatura</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead>Catedrático</TableHead>
                  <TableHead className="text-right">Alumnos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">
                      {c.codigo}
                    </TableCell>
                    <TableCell>{c.asignatura_nombre}</TableCell>
                    <TableCell>{c.seccion}</TableCell>
                    <TableCell>
                      <Link
                        href={`/catedraticos/${encodeURIComponent(c.catedratico_nombre)}`}
                        className="hover:underline"
                      >
                        {c.catedratico_nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.alumnos ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Kpi({
  label,
  valor,
}: {
  label: string;
  valor: string | number;
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
      </CardContent>
    </Card>
  );
}
