from collections import defaultdict

from modelo import Clase, Problema


UMBRAL_BAJO_HORAS = 4


def validar(clases: list[Clase]) -> list[Problema]:
    """Catedráticos con muy pocas horas totales en el período. Puede ser
    sub-utilización real, asignación pendiente, o un nombre mal capturado
    que no se cruza con otras filas del mismo catedrático."""
    horas_por_cated = defaultdict(float)
    refs_por_cated = defaultdict(list)

    for c in clases:
        if not c.catedratico or c.catedratico == "P.D.":
            continue
        h = c.horas_totales if c.horas_totales is not None else c.horas_reales_semanales
        horas_por_cated[c.catedratico] += h
        refs_por_cated[c.catedratico].append((c.fuente, c.hoja, c.fila))

    problemas: list[Problema] = []
    for cated, total in horas_por_cated.items():
        if total >= UMBRAL_BAJO_HORAS:
            continue
        problemas.append(Problema(
            tipo="subutilizacion_docente",
            severidad="baja",
            descripcion=(
                f"{cated} solo tiene {total:.0f} h/semana asignadas en total. "
                f"Verificar si es correcto o si falta cargar más clases."
            ),
            referencias=refs_por_cated[cated],
            extra={"catedratico": cated, "horas_totales": round(total, 2)},
        ))

    problemas.sort(key=lambda p: p.extra["horas_totales"])
    return problemas
