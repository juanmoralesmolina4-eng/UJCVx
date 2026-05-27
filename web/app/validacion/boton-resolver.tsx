"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => aplicar(false)}
      >
        Reabrir
      </Button>
    );
  }

  if (!editando) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
        onClick={() => setEditando(true)}
      >
        Resolver
      </Button>
    );
  }

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <Input
        autoFocus
        type="text"
        placeholder="Nota (opcional)"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        className="w-48 text-xs"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => aplicar(true, nota || undefined)}
          className="flex-1"
        >
          {isPending ? "..." : "Guardar"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditando(false);
            setNota(notaActual);
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
