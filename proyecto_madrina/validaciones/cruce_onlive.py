"""Cruce entre la programación oficial (Excel) y el reporte de Onlive.

PENDIENTE: implementar cuando llegue el archivo de Onlive.

Recibe DOS listas de `Clase` (una de cada fuente) y debe reportar:
- Secciones que están en la programación pero no en Onlive.
- Secciones que están en Onlive pero no en la programación.
- Secciones que existen en ambas pero con diferencias (catedrático, aula, horario, horas, etc.).
"""
from modelo import Clase, Problema


def validar(programacion: list[Clase], onlive: list[Clase]) -> list[Problema]:
    raise NotImplementedError(
        "validaciones/cruce_onlive.py aún no implementado. Necesita el cargador de Onlive."
    )
