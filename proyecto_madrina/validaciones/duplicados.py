from collections import defaultdict

from modelo import Clase, Problema


def validar(clases: list[Clase]) -> list[Problema]:
    """Detecta secciones que aparecen más de una vez con el mismo catedrático,
    código y sección."""
    grupos = defaultdict(list)
    for c in clases:
        if not c.catedratico or not c.codigo or not c.seccion:
            continue
        clave = (c.catedratico, c.codigo, c.seccion)
        grupos[clave].append(c)

    problemas: list[Problema] = []
    for (cated, codigo, seccion), instancias in grupos.items():
        if len(instancias) < 2:
            continue

        refs = [(c.fuente, c.hoja, c.fila) for c in instancias]
        problemas.append(Problema(
            tipo="duplicado",
            severidad="alta",
            descripcion=(
                f"La sección {seccion} de {codigo} ({instancias[0].asignatura}) "
                f"con el catedrático {cated} aparece {len(instancias)} veces."
            ),
            referencias=refs,
            extra={
                "catedratico": cated,
                "codigo": codigo,
                "seccion": seccion,
                "asignatura": instancias[0].asignatura,
            },
        ))

    return problemas
