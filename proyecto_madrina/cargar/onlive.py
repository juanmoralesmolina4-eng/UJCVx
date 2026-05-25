"""Cargador del reporte exportado del sistema Onlive.

PENDIENTE: implementar cuando llegue el archivo de muestra.

Debe devolver una lista de `Clase` (modelo.py) con la misma estructura que
`cargar/programacion.py`, asignando `fuente="ONLIVE"`. Así las validaciones
existentes funcionan sin cambios y el cruce con la programación es directo.
"""
from pathlib import Path

from modelo import Clase


def cargar_excel(path: str | Path) -> list[Clase]:
    raise NotImplementedError(
        "cargar/onlive.py aún no implementado. Esperando archivo de muestra de Martha."
    )
