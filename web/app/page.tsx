import Link from "next/link";
import {
  AlertTriangle,
  Activity,
  Users,
  DoorOpen,
  Upload,
  Wallet,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cargarDashboard } from "@/lib/dashboard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Panel — UJCVx",
};

const COLOR_SEVERIDAD: Record<string, string> = {
  alta: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  baja: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const ETIQUETAS_PROBLEMA: Record<string, string> = {
  consolidacion_inconsistente: "Consolidación inconsistente",
  duplicado: "Duplicado",
  solape_aula: "Solape de aula",
  solape_catedratico: "Solape de catedrático",
  horas_inconsistentes: "Horas inconsistentes",
  horario_sospechoso: "Horario sospechoso",
  sobrecarga_docente: "Sobrecarga docente",
  subutilizacion_docente: "Subutilización docente",
  seccion_grande: "Sección grande",
};

export default async function Panel() {
  const data = await cargarDashboard();
  const importacion = await ultimaImportacion();

  if (!data) {
    return <PanelVacio />;
  }

  const pendientes = data.problemas.filter((p) => !p.resuelto);
  const ocupacionPromedio =
    data.metricas_aulas.length > 0
      ? data.metricas_aulas.reduce((a, m) => a + m.porcentaje_ocupacion, 0) /
        data.metricas_aulas.length
      : 0;
  const topProblemas = [...pendientes]
    .sort((a, b) => severidadPeso(b.severidad) - severidadPeso(a.severidad))
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
        <p className="text-sm text-muted-foreground">
          Resumen del período en curso.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          titulo="Secciones"
          valor={data.totales.clases}
          icono={<Activity className="h-4 w-4" />}
        />
        <Kpi
          titulo="Catedráticos"
          valor={data.totales.catedraticos}
          icono={<Users className="h-4 w-4" />}
        />
        <Kpi
          titulo="Aulas en uso"
          valor={data.totales.aulas}
          sub={`${ocupacionPromedio.toFixed(0)}% ocupación promedio`}
          icono={<DoorOpen className="h-4 w-4" />}
        />
        <Kpi
          titulo="Problemas pendientes"
          valor={pendientes.length}
          tono={pendientes.length > 0 ? "alerta" : "ok"}
          icono={<AlertTriangle className="h-4 w-4" />}
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Atención requerida</CardTitle>
            {pendientes.length > 5 && (
              <Link
                href="/validacion"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Ver todos →
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {topProblemas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay problemas pendientes.
              </p>
            ) : (
              <ul className="space-y-2">
                {topProblemas.map((p, i) => (
                  <li
                    key={p.id ?? i}
                    className="flex items-start gap-2 rounded border bg-card p-3 text-sm"
                  >
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${COLOR_SEVERIDAD[p.severidad]}`}
                    >
                      {ETIQUETAS_PROBLEMA[p.tipo] ?? p.tipo}
                    </Badge>
                    <p className="flex-1 text-foreground">{p.descripcion}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Última carga</CardTitle>
          </CardHeader>
          <CardContent>
            {importacion ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium leading-tight break-words">
                  {nombreLimpio(importacion.archivo)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(importacion.created_at).toLocaleString("es-HN")}
                </p>
                <Badge variant="outline" className="capitalize">
                  {importacion.status}
                </Badge>
                <Link
                  href={`/importaciones/${importacion.id}`}
                  className="mt-2 flex items-center gap-1 text-xs text-foreground hover:underline"
                >
                  Ver detalle <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no se ha cargado ninguna programación.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Accesos rápidos
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <AccesoRapido
            href="/cargar"
            titulo="Cargar programación"
            descripcion="Procesar un nuevo archivo Excel"
            icono={<Upload className="h-5 w-5" />}
          />
          <AccesoRapido
            href="/pagos"
            titulo="Generar pago"
            descripcion="Excel listo para RRHH"
            icono={<Wallet className="h-5 w-5" />}
          />
          <AccesoRapido
            href="/eficiencia"
            titulo="Ver eficiencia"
            descripcion="Aulas y docentes"
            icono={<Activity className="h-5 w-5" />}
          />
        </div>
      </section>
    </div>
  );
}

function Kpi({
  titulo,
  valor,
  sub,
  icono,
  tono,
}: {
  titulo: string;
  valor: number;
  sub?: string;
  icono?: React.ReactNode;
  tono?: "ok" | "alerta";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {titulo}
        </CardTitle>
        <span
          className={
            tono === "alerta" && valor > 0
              ? "text-rose-600 dark:text-rose-400"
              : tono === "ok" && valor === 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
          }
        >
          {icono}
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{valor}</p>
        {sub && (
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AccesoRapido({
  href,
  titulo,
  descripcion,
  icono,
}: {
  href: string;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
    >
      <span className="rounded bg-muted p-2 text-foreground">{icono}</span>
      <div className="flex-1">
        <p className="font-medium text-sm">{titulo}</p>
        <p className="text-xs text-muted-foreground">{descripcion}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function PanelVacio() {
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
      </header>
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="rounded-full bg-muted p-3">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">Aún no hay datos cargados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cargue el archivo Excel de programación para comenzar.
            </p>
          </div>
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

interface ImportacionUltima {
  id: string;
  archivo: string;
  status: string;
  created_at: string;
}

async function ultimaImportacion(): Promise<ImportacionUltima | null> {
  try {
    const sb = createSupabaseAdminClient();
    const { data } = await sb
      .from("importaciones")
      .select("id, archivo, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    return (data?.[0] as ImportacionUltima | undefined) ?? null;
  } catch {
    return null;
  }
}

function severidadPeso(s: string): number {
  return s === "alta" ? 3 : s === "media" ? 2 : 1;
}

function nombreLimpio(archivo: string): string {
  const partes = archivo.split("/");
  const nombre = partes[partes.length - 1];
  // El nombre que subimos tiene timestamp prefijo: 2026-05-26T...__nombre.xlsx
  const sinStamp = nombre.replace(/^[\d\-T:.Z]+__/, "");
  return sinStamp.replace(/_/g, " ");
}
