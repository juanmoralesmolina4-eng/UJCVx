"""Pipeline de validación: carga el Excel de programación, corre todas las
validaciones disponibles y genera el reporte."""
import sys
from pathlib import Path

from cargar import programacion
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
import reporte
import excel_limpio


VALIDACIONES_SOBRE_CLASES = [
    duplicados,
    solapes,
    horas,
    horarios_sospechosos,
    sobrecarga,
    subutilizacion,
    secciones_grandes,
]


def ejecutar(ruta_excel: Path, ruta_reporte: Path, ruta_limpio: Path) -> None:
    print(f"Cargando {ruta_excel.name}...")
    clases = programacion.cargar_excel(ruta_excel)
    print(f"  {len(clases)} clases cargadas de {len({c.hoja for c in clases})} hojas")

    problemas = []

    encontrados = consolidacion.validar_archivo(ruta_excel)
    print(f"  consolidacion: {len(encontrados)} problemas")
    problemas.extend(encontrados)

    for mod in VALIDACIONES_SOBRE_CLASES:
        nombre = mod.__name__.rsplit(".", 1)[-1]
        encontrados = mod.validar(clases)
        print(f"  {nombre}: {len(encontrados)} problemas")
        problemas.extend(encontrados)

    print(f"Generando reporte: {ruta_reporte.name}")
    reporte.generar(problemas, ruta_reporte, total_clases=len(clases))

    print(f"Generando Excel limpio: {ruta_limpio.name}")
    excel_limpio.exportar(clases, ruta_limpio)

    print("Listo.")


if __name__ == "__main__":
    raiz = Path(__file__).resolve().parent.parent
    entrada = raiz / "PROGRAMACIÓN ACADÉMICA II PERÍODO 2026 (1).xlsx"
    reporte_path = raiz / "Reporte_validacion.xlsx"
    limpio_path = raiz / "Programacion_normalizada.xlsx"

    if len(sys.argv) > 1:
        entrada = Path(sys.argv[1])

    ejecutar(entrada, reporte_path, limpio_path)
