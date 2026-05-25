from collections import defaultdict

import config
from modelo import Clase, Problema


def validar(clases: list[Clase]) -> list[Problema]:
    """Suma las horas totales por catedrático y reporta los que superan el umbral."""
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
        if total <= config.UMBRAL_SOBRECARGA_H_SEMANA:
            continue
        problemas.append(Problema(
            tipo="sobrecarga_docente",
            severidad="media",
            descripcion=(
                f"{cated} acumula {total:.1f} h/semana entre todas sus clases "
                f"(umbral: {config.UMBRAL_SOBRECARGA_H_SEMANA} h)."
            ),
            referencias=refs_por_cated[cated],
            extra={"catedratico": cated, "horas_totales": round(total, 2)},
        ))

    problemas.sort(key=lambda p: -p.extra["horas_totales"])
    return problemas
