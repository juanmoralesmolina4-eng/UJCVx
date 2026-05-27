import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { agregarPorCatedratico, listarClasesUltimoPeriodo } from "@/lib/data";

export const metadata = {
  title: "Catedráticos — UJCVx",
};

export default async function CatedraticosPage() {
  const clases = await listarClasesUltimoPeriodo();
  const docentes = agregarPorCatedratico(clases);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Catedráticos</h1>
        <p className="text-sm text-muted-foreground">
          {docentes.length} catedráticos en el período actual.
        </p>
      </header>

      {docentes.length === 0 ? (
        <Card>
          <div className="p-6 text-sm text-muted-foreground">
            Aún no se han cargado catedráticos.
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catedrático</TableHead>
                <TableHead className="text-right">Clases</TableHead>
                <TableHead className="text-right">Asignaturas</TableHead>
                <TableHead className="text-right">H/sem</TableHead>
                <TableHead>Carreras</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docentes.map((d) => (
                <TableRow key={d.nombre}>
                  <TableCell>
                    <Link
                      href={`/catedraticos/${encodeURIComponent(d.nombre)}`}
                      className="font-medium hover:underline"
                    >
                      {d.nombre}
                    </Link>
                    {d.es_nuevo && (
                      <Badge
                        variant="outline"
                        className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        Nuevo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {d.n_clases}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {d.asignaturas_unicas}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {d.horas_semanales.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {d.carreras.join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
