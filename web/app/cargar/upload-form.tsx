"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { subirExcel } from "./actions";

type Estado =
  | { kind: "idle" }
  | { kind: "subiendo"; nombre: string }
  | {
      kind: "ok";
      nombre: string;
      importacionId: string;
      totalClases?: number;
      totalProblemas?: number;
    }
  | { kind: "error"; mensaje: string };

export function UploadForm() {
  const [estado, setEstado] = useState<Estado>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function subir(archivo: File) {
    if (!archivo.name.toLowerCase().endsWith(".xlsx")) {
      setEstado({
        kind: "error",
        mensaje: "Solo se admiten archivos con extensión .xlsx",
      });
      return;
    }
    if (archivo.size > 50 * 1024 * 1024) {
      setEstado({
        kind: "error",
        mensaje: "El archivo excede el tamaño máximo de 50 MB",
      });
      return;
    }

    setEstado({ kind: "subiendo", nombre: archivo.name });

    const formData = new FormData();
    formData.append("archivo", archivo);

    startTransition(async () => {
      const r = await subirExcel(formData);
      if (r.ok && r.importacionId) {
        setEstado({
          kind: "ok",
          nombre: archivo.name,
          importacionId: r.importacionId,
          totalClases: r.totalClases,
          totalProblemas: r.totalProblemas,
        });
        router.refresh();
      } else {
        setEstado({
          kind: "error",
          mensaje: r.mensaje ?? "Error desconocido",
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) subir(f);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-12 text-center transition-colors",
          dragOver
            ? "border-foreground bg-accent"
            : "border-border hover:border-foreground/50",
        )}
      >
        <input
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) subir(f);
          }}
        />
        <div className="mb-4 rounded-full bg-muted p-3">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-base font-medium">
          Arrastre el archivo Excel
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          o haga clic para seleccionarlo
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Formato .xlsx · tamaño máximo 50 MB
        </p>
      </label>

      <EstadoCard estado={estado} />
    </div>
  );
}

function EstadoCard({ estado }: { estado: Estado }) {
  if (estado.kind === "idle") return null;

  if (estado.kind === "subiendo") {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Procesando {estado.nombre}</p>
            <p className="text-xs text-muted-foreground">
              Lectura del archivo y validaciones automáticas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (estado.kind === "ok") {
    return (
      <Card className="border-emerald-200 dark:border-emerald-900">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Procesamiento completado</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <FileSpreadsheet className="mr-1 inline h-3 w-3" />
                {estado.nombre}
              </p>
              {estado.totalClases !== undefined && (
                <p className="mt-2 text-sm">
                  {estado.totalClases} secciones cargadas ·{" "}
                  {estado.totalProblemas ?? 0} problemas detectados
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={`/importaciones/${estado.importacionId}`}>
                    Ver detalle
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href="/validacion">Ver problemas</a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href="/eficiencia">Ver eficiencia</a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-rose-200 dark:border-rose-900">
      <CardContent className="flex items-start gap-3 py-4">
        <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">La carga no pudo completarse</p>
          <p className="mt-1 text-sm text-muted-foreground">{estado.mensaje}</p>
        </div>
      </CardContent>
    </Card>
  );
}
