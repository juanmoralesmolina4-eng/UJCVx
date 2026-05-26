"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { marcarProblema } from "./actions";

interface Props {
  id: string;
  resuelto: boolean;
  notaActual: string;
}

export function BotonResolver({ id, resuelto, notaActual }: Props) {
  const [editando, setEditando] = useState(false);
  const [nota, setNota] = useState(notaActual);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function aplicar(nuevoEstado: boolean, notaFinal?: string) {
    startTransition(async () => {
      const r = await marcarProblema(id, nuevoEstado, notaFinal);
      if (r.ok) {
        setEditando(false);
        router.refresh();
      } else {
        alert(`Error: ${r.mensaje}`);
      }
    });
  }

  if (resuelto) {
    return (
      <button
        onClick={() => aplicar(false)}
        disabled={isPending}
        className="shrink-0 rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        Reabrir
      </button>
    );
  }

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        className="shrink-0 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
      >
        Resolver
      </button>
    );
  }

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <input
        autoFocus
        type="text"
        placeholder="Nota (opcional)"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        className="w-48 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
      />
      <div className="flex gap-2">
        <button
          onClick={() => aplicar(true, nota || undefined)}
          disabled={isPending}
          className="flex-1 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "..." : "Guardar"}
        </button>
        <button
          onClick={() => {
            setEditando(false);
            setNota(notaActual);
          }}
          className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
