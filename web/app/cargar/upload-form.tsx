"use client";

import { useState } from "react";

type Estado =
  | { kind: "idle" }
  | { kind: "leyendo"; nombre: string }
  | { kind: "listo"; nombre: string; tamano: number }
  | { kind: "error"; mensaje: string };

export function UploadForm() {
  const [estado, setEstado] = useState<Estado>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);

  function recibirArchivo(archivo: File) {
    if (!archivo.name.toLowerCase().endsWith(".xlsx")) {
      setEstado({ kind: "error", mensaje: "Solo se aceptan archivos .xlsx" });
      return;
    }
    setEstado({ kind: "leyendo", nombre: archivo.name });
    setTimeout(() => {
      setEstado({ kind: "listo", nombre: archivo.name, tamano: archivo.size });
    }, 600);
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
          if (f) recibirArchivo(f);
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
            if (f) recibirArchivo(f);
          }}
        />
        <p className="text-lg font-medium">Suelta el Excel aquí</p>
        <p className="mt-2 text-sm text-zinc-500">o haz clic para elegirlo</p>
        <p className="mt-4 text-xs text-zinc-400">
          Acepta .xlsx — los .xls hay que convertirlos primero.
        </p>
      </label>

      <EstadoCard estado={estado} />

      {estado.kind === "listo" && (
        <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Procesamiento aún no conectado
          </p>
          <p className="mt-1 text-zinc-700 dark:text-zinc-400">
            El archivo se leyó correctamente. Falta enchufar el pipeline al
            backend (Supabase + endpoint de procesamiento). Por ahora se sigue
            ejecutando desde Python en local.
          </p>
        </div>
      )}
    </div>
  );
}

function EstadoCard({ estado }: { estado: Estado }) {
  if (estado.kind === "idle") return null;

  if (estado.kind === "leyendo") {
    return (
      <div className="rounded border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          Leyendo <span className="font-medium">{estado.nombre}</span>…
        </p>
      </div>
    );
  }

  if (estado.kind === "listo") {
    const kb = (estado.tamano / 1024).toFixed(0);
    return (
      <div className="rounded border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="font-medium text-emerald-700 dark:text-emerald-300">
          Archivo cargado
        </p>
        <p className="mt-1 text-zinc-700 dark:text-zinc-400">
          {estado.nombre} ({kb} KB)
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
