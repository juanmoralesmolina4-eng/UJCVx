"""Plantilla del formato que Recursos Humanos exige para procesar pagos.

PENDIENTE: implementar cuando Martha comparta la plantilla exacta.

Este módulo no carga: define la estructura de columnas que RRHH espera y la
función `exportar` que toma una lista de `Clase` validadas y produce el
archivo en el formato pedido. Pertenece al lado de salida del pipeline.
"""
from pathlib import Path

from modelo import Clase


def exportar(clases: list[Clase], ruta_salida: str | Path) -> None:
    raise NotImplementedError(
        "cargar/rrhh.py aún no implementado. Esperando plantilla oficial de Martha."
    )
