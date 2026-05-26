"""Pipeline de validación: carga el Excel de programación, corre todas las
validaciones disponibles y genera los archivos de salida (reporte de
problemas, Excel normalizado, CSV exportable, archivo de pago RRHH)."""
from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

from cargar import programacion
from exportar import reporte, excel_limpio, rrhh, metricas_excel, json_dashboard
from exportar import csv as exportar_csv
from metricas import aulas as metricas_aulas
from metricas import docentes as metricas_docentes
from validaciones import (
    consolidacion,
    duplicados,
    solapes,
    horas,
    horarios_sospechosos,
    sobrecarga,
    subutilizacion,
    secciones_grandes,
)


VALIDACIONES = [
    consolidacion,
    duplicados,
    solapes,
    horas,
    horarios_sospechosos,
    sobrecarga,
    subutilizacion,
    secciones_grandes,
]


@dataclass
class RutasSalida:
    reporte: Path
    excel_limpio: Path
    csv: Path
    pago_rrhh: Path
    metricas: Path
    json_dashboard: Path


def ejecutar(ruta_excel: Path, salidas: RutasSalida) -> None:
    print(f"Cargando {ruta_excel.name}...")
    clases_validacion = programacion.cargar_excel(ruta_excel, omitir_consolidadas=True)
    clases_consolidacion = programacion.cargar_excel(ruta_excel, omitir_consolidadas=False)
    print(f"  {len(clases_validacion)} clases cargadas de {len({c.hoja for c in clases_validacion})} hojas")

    problemas = []
    for mod in VALIDACIONES:
        nombre = mod.__name__.rsplit(".", 1)[-1]
        clases_in = clases_consolidacion if mod is consolidacion else clases_validacion
        encontrados = mod.validar(clases_in)
        print(f"  {nombre}: {len(encontrados)} problemas")
        problemas.extend(encontrados)

    print(f"Generando reporte de validación -> {salidas.reporte.name}")
    reporte.generar(problemas, salidas.reporte, total_clases=len(clases_validacion))

    print(f"Generando Excel normalizado -> {salidas.excel_limpio.name}")
    excel_limpio.exportar(clases_validacion, salidas.excel_limpio)

    print(f"Generando CSV exportable -> {salidas.csv.name}")
    exportar_csv.exportar(clases_validacion, salidas.csv)

    print(f"Generando archivo de pago RRHH -> {salidas.pago_rrhh.name}")
    rrhh.exportar(clases_validacion, salidas.pago_rrhh)

    print(f"Calculando métricas de eficiencia -> {salidas.metricas.name}")
    ma = metricas_aulas.calcular(clases_validacion)
    md = metricas_docentes.calcular(clases_validacion)
    metricas_excel.exportar(ma, md, salidas.metricas)

    print(f"Generando JSON dashboard -> {salidas.json_dashboard.name}")
    json_dashboard.exportar(clases_validacion, problemas, ma, md, salidas.json_dashboard)

    print("Listo.")


if __name__ == "__main__":
    raiz = Path(__file__).resolve().parent.parent
    entrada = raiz / "PROGRAMACIÓN ACADÉMICA II PERÍODO 2026 (1).xlsx"
    salidas = RutasSalida(
        reporte=raiz / "Reporte_validacion.xlsx",
        excel_limpio=raiz / "Programacion_normalizada.xlsx",
        csv=raiz / "Programacion_normalizada.csv",
        pago_rrhh=raiz / "Pago_RRHH_borrador.xlsx",
        metricas=raiz / "Reporte_metricas.xlsx",
        json_dashboard=raiz / "web" / "data" / "dashboard.json",
    )

    if len(sys.argv) > 1:
        entrada = Path(sys.argv[1])

    ejecutar(entrada, salidas)
