"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
      setEstado({ kind: "error", mensaje: "Solo se aceptan archivos .xlsx" });
      return;
    }
    if (archivo.size > 50 * 1024 * 1024) {
      setEstado({ kind: "error", mensaje: "El archivo excede 50 MB" });
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
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors",
          dragOver
            ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
            : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500",
        ].join(" ")}
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
        <p className="text-lg font-medium">Suelta el Excel aquí</p>
        <p className="mt-2 text-sm text-zinc-500">o haz clic para elegirlo</p>
        <p className="mt-4 text-xs text-zinc-400">Acepta .xlsx hasta 50 MB.</p>
      </label>

      <EstadoCard estado={estado} />
    </div>
  );
}

function EstadoCard({ estado }: { estado: Estado }) {
  if (estado.kind === "idle") return null;

  if (estado.kind === "subiendo") {
    return (
      <div className="rounded border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          Subiendo y procesando <span className="font-medium">{estado.nombre}</span>…
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Puede tardar 5–10 segundos por la lectura del Excel y las validaciones.
        </p>
      </div>
    );
  }

  if (estado.kind === "ok") {
    return (
      <div className="rounded border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="font-medium text-emerald-700 dark:text-emerald-300">
          Procesado correctamente
        </p>
        <p className="mt-1 text-zinc-700 dark:text-zinc-400">
          {estado.nombre} — importación{" "}
          <code className="text-xs">{estado.importacionId.slice(0, 8)}</code>
        </p>
        {estado.totalClases !== undefined && (
          <p className="mt-2 text-zinc-700 dark:text-zinc-400">
            {estado.totalClases} clases cargadas · {estado.totalProblemas ?? 0} problemas detectados.
          </p>
        )}
        <p className="mt-3 flex gap-3 text-xs">
          <a
            href={`/importaciones/${estado.importacionId}`}
            className="text-emerald-700 underline dark:text-emerald-300"
          >
            Ver detalle
          </a>
          <a
            href="/validacion"
            className="text-emerald-700 underline dark:text-emerald-300"
          >
            Ver validación
          </a>
          <a
            href="/eficiencia"
            className="text-emerald-700 underline dark:text-emerald-300"
          >
            Ver eficiencia
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-rose-300 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">
      <p className="font-medium text-rose-700 dark:text-rose-300">
        No se pudo cargar
      </p>
      <p className="mt-1 text-zinc-700 dark:text-zinc-400">{estado.mensaje}</p>
    </div>
  );
}
