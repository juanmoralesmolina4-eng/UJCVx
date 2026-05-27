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
import {
  clasesDeCatedratico,
  listarClasesUltimoPeriodo,
} from "@/lib/data";

export const metadata = {
  title: "Catedrático — UJCVx",
};

export default async function CatedraticoDetalle({
  params,
}: {
  params: Promise<{ nombre: string }>;
}) {
  const { nombre: nombreRaw } = await params;
  const nombre = decodeURIComponent(nombreRaw);

  const todasLasClases = await listarClasesUltimoPeriodo();
  const clases = clasesDeCatedratico(todasLasClases, nombre);

  if (clases.length === 0) notFound();

  const bloques = clases.flatMap((c) =>
    c.bloques_horarios.map((b) => ({
      dia: b.dia,
      inicioMin: b.inicio_min,
      finMin: b.fin_min,
      titulo: c.asignatura_nombre,
      subtitulo: `${c.codigo} · ${c.seccion} · ${c.aula_texto}`,
      color: colorPorClave(c.codigo),
    })),
  );

  const horasSemanales = bloques.reduce(
    (acc, b) => acc + (b.finMin - b.inicioMin) / 60,
    0,
  );
  const diasTrabajados = new Set(bloques.map((b) => b.dia)).size;
  const carreras = [
    ...new Set(clases.map((c) => c.carrera_codigo).filter(Boolean)),
  ];

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/catedraticos"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Catedráticos
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{nombre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {carreras.join(" · ") || "Sin carrera asignada"}
        </p>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-4">
        <Kpi label="Clases" valor={clases.length} />
        <Kpi label="Horas/sem" valor={horasSemanales.toFixed(1)} />
        <Kpi label="Días/sem" valor={diasTrabajados} />
        <Kpi
          label="Asignaturas"
          valor={new Set(clases.map((c) => c.codigo)).size}
        />
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
            <CardTitle className="text-base">Sus clases</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Asignatura</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead>Aula</TableHead>
                  <TableHead className="text-right">Alumnos</TableHead>
                  <TableHead className="text-right">H/sem</TableHead>
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
                      {c.aula_texto.includes("VIRTUAL") ? (
                        <span className="text-muted-foreground">Virtual</span>
                      ) : (
                        <Link
                          href={`/aulas/${encodeURIComponent(c.aula_texto)}`}
                          className="hover:underline"
                        >
                          {c.aula_texto}
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.alumnos ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.horas_totales ?? "—"}
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
