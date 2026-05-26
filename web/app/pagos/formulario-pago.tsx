"use client";

import { useState } from "react";

const PAGOS = [
  { numero: 1, label: "Primer pago" },
  { numero: 2, label: "Segundo pago" },
  { numero: 3, label: "Tercer pago" },
  { numero: 4, label: "Cuarto pago" },
];

const CAMPUS = [
  { codigo: "TEGUCIGALPA", label: "Tegucigalpa" },
  { codigo: "COMAYAGUA", label: "Comayagua" },
];

const PERIODOS = [
  { codigo: "I PAC 2026", label: "I PAC 2026" },
  { codigo: "II PAC 2026", label: "II PAC 2026" },
  { codigo: "III PAC 2026", label: "III PAC 2026" },
];

export function FormularioPago() {
  const [numero, setNumero] = useState(1);
  const [semanas, setSemanas] = useState(4);
  const [tarifa, setTarifa] = useState(230);
  const [campus, setCampus] = useState("TEGUCIGALPA");
  const [periodo, setPeriodo] = useState("II PAC 2026");
  const [isPending, setIsPending] = useState(false);

  async function descargar() {
    setIsPending(true);
    try {
      const params = new URLSearchParams({
        numero: numero.toString(),
        semanas: semanas.toString(),
        tarifa: tarifa.toString(),
        campus,
        periodo,
      });
      const r = await fetch(`/api/pago/generar?${params.toString()}`);
      if (!r.ok) {
        const t = await r.text();
        alert(`Error: ${t}`);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const titulo =
        PAGOS.find((p) => p.numero === numero)?.label ?? "Pago";
      a.href = url;
      a.download = `${titulo} ${campus} ${periodo}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo label="Número de pago">
          <select
            value={numero}
            onChange={(e) => setNumero(Number(e.target.value))}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {PAGOS.map((p) => (
              <option key={p.numero} value={p.numero}>
                {p.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Campus">
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {CAMPUS.map((c) => (
              <option key={c.codigo} value={c.codigo}>
                {c.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Periodo">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {PERIODOS.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Semanas a pagar">
          <input
            type="number"
            min={1}
            max={16}
            value={semanas}
            onChange={(e) => setSemanas(Math.max(1, Number(e.target.value)))}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </Campo>

        <Campo label="Tarifa por hora (L)">
          <input
            type="number"
            min={0}
            value={tarifa}
            onChange={(e) => setTarifa(Math.max(0, Number(e.target.value)))}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </Campo>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Las deducciones (IHSS, UJCV, embargo, ACH) se dejan en 0 y se
          completan a mano en el Excel.
        </p>
        <button
          onClick={descargar}
          disabled={isPending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending ? "Generando…" : "Descargar Excel"}
        </button>
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
