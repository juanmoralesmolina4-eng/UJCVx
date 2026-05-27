"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGOS = [
  { numero: "1", label: "Primer pago" },
  { numero: "2", label: "Segundo pago" },
  { numero: "3", label: "Tercer pago" },
  { numero: "4", label: "Cuarto pago" },
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
  const [numero, setNumero] = useState("1");
  const [semanas, setSemanas] = useState(4);
  const [tarifa, setTarifa] = useState(230);
  const [campus, setCampus] = useState("TEGUCIGALPA");
  const [periodo, setPeriodo] = useState("II PAC 2026");
  const [isPending, setIsPending] = useState(false);

  async function descargar() {
    setIsPending(true);
    try {
      const params = new URLSearchParams({
        numero,
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
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="numero">Número de pago</Label>
          <Select value={numero} onValueChange={setNumero}>
            <SelectTrigger id="numero">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGOS.map((p) => (
                <SelectItem key={p.numero} value={p.numero}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campus">Campus</Label>
          <Select value={campus} onValueChange={setCampus}>
            <SelectTrigger id="campus">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAMPUS.map((c) => (
                <SelectItem key={c.codigo} value={c.codigo}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="periodo">Período</Label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger id="periodo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.codigo} value={p.codigo}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="semanas">Semanas a pagar</Label>
          <Input
            id="semanas"
            type="number"
            min={1}
            max={16}
            value={semanas}
            onChange={(e) => setSemanas(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tarifa">Tarifa por hora (L)</Label>
          <Input
            id="tarifa"
            type="number"
            min={0}
            value={tarifa}
            onChange={(e) => setTarifa(Math.max(0, Number(e.target.value)))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Las deducciones (IHSS, UJCV, embargo, ACH) se generan en cero y
          deben completarse manualmente en el archivo descargado.
        </p>
        <Button onClick={descargar} disabled={isPending}>
          <Download className="mr-2 h-4 w-4" />
          {isPending ? "Generando…" : "Descargar"}
        </Button>
      </div>
    </div>
  );
}
