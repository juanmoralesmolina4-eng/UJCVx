/**
 * Grid horario semanal. Dibuja los bloques de clases en una rejilla
 * día × hora, escalando el alto proporcional a la duración.
 */
import { minutosAHHMM, type Dia } from "@/lib/types";

interface BloqueRender {
  dia: Dia;
  inicioMin: number;
  finMin: number;
  titulo: string;
  subtitulo?: string;
  color?: "azul" | "esmeralda" | "ambar" | "purpura" | "rosa" | "indigo";
}

interface Props {
  bloques: BloqueRender[];
  /** Hora más temprana mostrada en la grid (en minutos). Default 7:00. */
  horaInicio?: number;
  /** Hora más tardía. Default 21:00. */
  horaFin?: number;
  /** Si true, oculta sábado y domingo cuando no hay nada en ellos. */
  ocultarFinSemanaVacio?: boolean;
}

const DIAS: Dia[] = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

const ETIQUETAS: Record<Dia, string> = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viernes",
  SAB: "Sábado",
  DOM: "Domingo",
};

const COLORES: Record<NonNullable<BloqueRender["color"]>, string> = {
  azul: "bg-sky-100 border-sky-400 text-sky-900 dark:bg-sky-950/60 dark:border-sky-700 dark:text-sky-100",
  esmeralda: "bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-100",
  ambar: "bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-100",
  purpura: "bg-purple-100 border-purple-400 text-purple-900 dark:bg-purple-950/60 dark:border-purple-700 dark:text-purple-100",
  rosa: "bg-rose-100 border-rose-400 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-100",
  indigo: "bg-indigo-100 border-indigo-400 text-indigo-900 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-100",
};

const PIXELS_POR_HORA = 48;

export function HorarioSemanal({
  bloques,
  horaInicio = 7 * 60,
  horaFin = 21 * 60,
  ocultarFinSemanaVacio = true,
}: Props) {
  const diasVisibles = ocultarFinSemanaVacio
    ? DIAS.filter(
        (d) => d !== "SAB" && d !== "DOM" || bloques.some((b) => b.dia === d),
      )
    : DIAS;

  const altoTotal = ((horaFin - horaInicio) / 60) * PIXELS_POR_HORA;
  const horas: number[] = [];
  for (let h = horaInicio; h <= horaFin; h += 60) horas.push(h);

  return (
    <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `64px repeat(${diasVisibles.length}, minmax(140px, 1fr))`,
        }}
      >
        <div className="border-b border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
        {diasVisibles.map((d) => (
          <div
            key={d}
            className="border-b border-r border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          >
            {ETIQUETAS[d]}
          </div>
        ))}

        <div
          className="relative border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
          style={{ height: altoTotal }}
        >
          {horas.map((h) => (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-zinc-500"
              style={{ top: ((h - horaInicio) / 60) * PIXELS_POR_HORA }}
            >
              {minutosAHHMM(h)}
            </div>
          ))}
        </div>

        {diasVisibles.map((d) => (
          <div
            key={d}
            className="relative border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            style={{ height: altoTotal }}
          >
            {horas.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-dashed border-zinc-100 dark:border-zinc-800"
                style={{ top: ((h - horaInicio) / 60) * PIXELS_POR_HORA }}
              />
            ))}
            {bloques
              .filter((b) => b.dia === d)
              .map((b, i) => {
                const top = ((b.inicioMin - horaInicio) / 60) * PIXELS_POR_HORA;
                const alto = ((b.finMin - b.inicioMin) / 60) * PIXELS_POR_HORA;
                return (
                  <div
                    key={`${d}-${i}`}
                    className={`absolute left-1 right-1 overflow-hidden rounded border-l-4 px-2 py-1 text-xs ${COLORES[b.color ?? "azul"]}`}
                    style={{ top, height: alto }}
                  >
                    <p className="text-[10px] tabular-nums opacity-70">
                      {minutosAHHMM(b.inicioMin)}–{minutosAHHMM(b.finMin)}
                    </p>
                    <p className="font-medium leading-tight">{b.titulo}</p>
                    {b.subtitulo && (
                      <p className="mt-0.5 text-[11px] opacity-80">
                        {b.subtitulo}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Asigna colores rotativos a una lista de claves (catedráticos, asignaturas, etc.). */
export function colorPorClave(
  clave: string,
): NonNullable<BloqueRender["color"]> {
  const colores: NonNullable<BloqueRender["color"]>[] = [
    "azul",
    "esmeralda",
    "ambar",
    "purpura",
    "rosa",
    "indigo",
  ];
  let hash = 0;
  for (let i = 0; i < clave.length; i++) {
    hash = (hash * 31 + clave.charCodeAt(i)) | 0;
  }
  return colores[Math.abs(hash) % colores.length];
}
