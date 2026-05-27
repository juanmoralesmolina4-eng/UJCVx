import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Historial — UJCVx",
};

interface ImportacionRow {
  id: string;
  tipo: string;
  archivo: string;
  total_filas: number | null;
  status: "pendiente" | "procesando" | "completada" | "fallida";
  error: string | null;
  created_at: string;
}

const VARIANTE_STATUS: Record<
  ImportacionRow["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  pendiente: "secondary",
  procesando: "default",
  completada: "default",
  fallida: "destructive",
};

const COLOR_STATUS: Record<ImportacionRow["status"], string> = {
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  procesando: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  completada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  fallida: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export default async function ImportacionesPage() {
  const sb = createSupabaseAdminClient();

  const { data, error } = await sb
    .from("importaciones")
    .select("id, tipo, archivo, total_filas, status, error, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const importaciones = (data ?? []) as ImportacionRow[];

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Historial</h1>
        <p className="text-sm text-muted-foreground">
          Registro completo de las cargas realizadas.
        </p>
      </header>

      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">
            {error.message}
          </CardContent>
        </Card>
      )}

      {!error && importaciones.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sin registros</CardTitle>
            <CardDescription>
              Aún no se ha cargado ninguna programación. Vaya a la sección{" "}
              <Link href="/cargar" className="underline">
                Cargar
              </Link>{" "}
              para comenzar.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Archivo</TableHead>
                <TableHead className="text-right">Filas</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importaciones.map((imp) => (
                <TableRow key={imp.id} className="cursor-pointer">
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    <Link
                      href={`/importaciones/${imp.id}`}
                      className="block py-1"
                    >
                      {new Date(imp.created_at).toLocaleString("es-HN")}
                    </Link>
                  </TableCell>
                  <TableCell className="break-all text-xs">
                    <Link
                      href={`/importaciones/${imp.id}`}
                      className="block py-1"
                    >
                      {nombreLimpio(imp.archivo)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Link
                      href={`/importaciones/${imp.id}`}
                      className="block py-1"
                    >
                      {imp.total_filas ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/importaciones/${imp.id}`}
                      className="block py-1"
                    >
                      <Badge
                        variant={VARIANTE_STATUS[imp.status]}
                        className={COLOR_STATUS[imp.status]}
                      >
                        {imp.status}
                      </Badge>
                      {imp.error && (
                        <p className="mt-1 text-xs text-rose-600">
                          {imp.error}
                        </p>
                      )}
                    </Link>
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

function nombreLimpio(archivo: string): string {
  const partes = archivo.split("/");
  const nombre = partes[partes.length - 1];
  const sinStamp = nombre.replace(/^[\d\-T:.Z]+__/, "");
  return sinStamp.replace(/_/g, " ");
}
