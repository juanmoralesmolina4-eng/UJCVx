import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Aulas</h1>
        <p className="text-sm text-muted-foreground">
          {fisicas.length} aulas físicas y {virtuales.length} espacios virtuales en uso.
        </p>
      </header>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-medium">Aulas físicas</h2>
          <Tabla aulas={fisicas} mostrarOcupacion />
        </section>

        {virtuales.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium">Espacios virtuales</h2>
            <Tabla aulas={virtuales} />
          </section>
        )}
      </div>
    </div>
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
      <Card>
        <div className="p-6 text-sm text-muted-foreground">Sin registros.</div>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aula</TableHead>
            <TableHead className="text-right">Clases</TableHead>
            <TableHead className="text-right">H/sem</TableHead>
            {mostrarOcupacion && <TableHead>Ocupación</TableHead>}
            <TableHead className="text-right">Catedráticos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aulas.map((a) => {
            const ocupacion = (100 * a.horas_semanales) / HORAS_JORNADA_SEMANA;
            const color =
              ocupacion < 25
                ? "bg-rose-500"
                : ocupacion > 80
                  ? "bg-emerald-500"
                  : "bg-sky-500";
            return (
              <TableRow key={a.codigo}>
                <TableCell>
                  <Link
                    href={`/aulas/${encodeURIComponent(a.codigo)}`}
                    className="font-medium hover:underline"
                  >
                    {a.codigo}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {a.n_clases}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {a.horas_semanales.toFixed(1)}
                </TableCell>
                {mostrarOcupacion && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded bg-muted">
                        <div
                          className={`h-full ${color}`}
                          style={{ width: `${Math.min(ocupacion, 100)}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {ocupacion.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-right tabular-nums">
                  {a.catedraticos.length}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
