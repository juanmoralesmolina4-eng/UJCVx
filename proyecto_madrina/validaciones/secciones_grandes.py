from modelo import Clase, Problema


UMBRAL_ALUMNOS = 30


def validar(clases: list[Clase]) -> list[Problema]:
    """Secciones con más alumnos del umbral. Indica posible necesidad de
    abrir una sección adicional o de un aula con mayor capacidad."""
    problemas: list[Problema] = []

    for c in clases:
        if c.alumnos is None or c.alumnos <= UMBRAL_ALUMNOS:
            continue
        problemas.append(Problema(
            tipo="seccion_grande",
            severidad="baja",
            descripcion=(
                f"{c.codigo} sec {c.seccion} ({c.asignatura}) con {c.catedratico} "
                f"tiene {c.alumnos} alumnos. Verificar capacidad del aula {c.aula} "
                f"o considerar abrir una sección adicional."
            ),
            referencias=[(c.fuente, c.hoja, c.fila)],
            extra={"alumnos": c.alumnos, "aula": c.aula, "codigo": c.codigo},
        ))

    problemas.sort(key=lambda p: -p.extra["alumnos"])
    return problemas
