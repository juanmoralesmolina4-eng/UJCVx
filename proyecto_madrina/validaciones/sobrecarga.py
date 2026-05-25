from collections import defaultdict

from modelo import Clase, Problema


UMBRAL_HORAS_SEMANALES = 40


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
        if total <= UMBRAL_HORAS_SEMANALES:
            continue
        problemas.append(Problema(
            tipo="sobrecarga_docente",
            severidad="media",
            descripcion=(
                f"{cated} acumula {total:.1f} h/semana entre todas sus clases "
                f"(umbral: {UMBRAL_HORAS_SEMANALES} h)."
            ),
            referencias=refs_por_cated[cated],
            extra={"catedratico": cated, "horas_totales": round(total, 2)},
        ))

    problemas.sort(key=lambda p: -p.extra["horas_totales"])
    return problemas
