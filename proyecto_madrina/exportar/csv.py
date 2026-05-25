"""Exporta la lista de Clases normalizadas a CSV (UTF-8 con BOM para Excel).

CSV es el formato que Martha pidió poder importar a otras aplicaciones.
Cada fila es una sección; los bloques horarios van como columnas LUN..DOM
con varios rangos separados por ` | ` cuando hay más de uno."""
from __future__ import annotations

import csv as _csv
from collections import defaultdict
from pathlib import Path

from modelo import Clase, DIAS
from normalizar import minutos_a_hhmm


COLUMNAS = [
    "fuente", "hoja", "fila_origen",
    "catedratico", "catedratico_es_nuevo",
    "codigo", "codigos_alternos", "asignatura", "carrera",
    "alumnos", "modalidad", "aula", "seccion",
    "horas_presenciales", "horas_asincronicas", "horas_totales", "horas_reales_calculadas",
    *[d.lower() for d in DIAS],
    "observaciones",
]


def exportar(clases: list[Clase], ruta_salida: str | Path) -> None:
    with open(ruta_salida, "w", encoding="utf-8-sig", newline="") as f:
        writer = _csv.DictWriter(f, fieldnames=COLUMNAS)
        writer.writeheader()
        for c in clases:
            writer.writerow(_fila_csv(c))


def _fila_csv(c: Clase) -> dict[str, object]:
    bloques_por_dia: dict[str, list[str]] = defaultdict(list)
    for b in c.bloques:
        bloques_por_dia[b.dia].append(
            f"{minutos_a_hhmm(b.inicio)}-{minutos_a_hhmm(b.fin)}"
        )

    return {
        "fuente": c.fuente,
        "hoja": c.hoja,
        "fila_origen": c.fila,
        "catedratico": c.catedratico,
        "catedratico_es_nuevo": "Sí" if c.catedratico_es_nuevo else "",
        "codigo": c.codigo,
        "codigos_alternos": ",".join(c.codigos_alternos),
        "asignatura": c.asignatura,
        "carrera": c.carrera,
        "alumnos": c.alumnos if c.alumnos is not None else "",
        "modalidad": c.modalidad,
        "aula": c.aula,
        "seccion": c.seccion,
        "horas_presenciales": c.horas_presenciales if c.horas_presenciales is not None else "",
        "horas_asincronicas": c.horas_asincronicas if c.horas_asincronicas is not None else "",
        "horas_totales": c.horas_totales if c.horas_totales is not None else "",
        "horas_reales_calculadas": c.horas_reales_semanales,
        **{d.lower(): " | ".join(bloques_por_dia.get(d, [])) for d in DIAS},
        "observaciones": c.observaciones,
    }
