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

  if (clases.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Pagos</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Cargue una programación para generar pagos.
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

  const preview = calcularPagos(clases, {
    semanasAPagar: 4,
    tarifaPorHoraDefault: 230,
  });
  const totales = totalesGlobales(preview);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Pagos</h1>
        <p className="text-sm text-muted-foreground">
          Generación del archivo de pago en el formato requerido por Recursos
          Humanos.
        </p>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-4">
        <Kpi label="Catedráticos" valor={totales.nCatedraticos.toString()} />
        <Kpi label="Clases" valor={totales.nClases.toString()} />
        <Kpi
          label="Ingresos defaults"
          valor={FMT_LPS.format(totales.totalIngresos)}
          sub="4 semanas × 230 L"
        />
        <Kpi
          label="A pagar"
          valor={FMT_LPS.format(totales.totalAPagar)}
          sub="sin deducciones"
        />
      </section>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Parámetros y descarga</CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioPago />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Vista previa por catedrático (con valores por defecto)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catedrático</TableHead>
                <TableHead className="text-right">Clases</TableHead>
                <TableHead className="text-right">H/sem</TableHead>
                <TableHead className="text-right">Total ingresos</TableHead>
                <TableHead className="text-right">A pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((p) => {
                const hSem = p.clases.reduce(
                  (a, b) => a + b.horasPorSemana,
                  0,
                );
                return (
                  <TableRow key={p.catedratico}>
                    <TableCell className="font-medium">
                      {p.catedratico}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.clases.length}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {hSem}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {FMT_LPS.format(p.totalIngresos)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {FMT_LPS.format(p.totalAPagar)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  valor,
  sub,
}: {
  label: string;
  valor: string;
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
        <p className="text-2xl font-semibold tabular-nums">{valor}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
