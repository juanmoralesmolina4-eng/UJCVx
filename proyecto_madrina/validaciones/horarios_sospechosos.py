from modelo import Clase, Problema
from normalizar import minutos_a_hhmm


BLOQUE_MUY_LARGO_MIN = 5 * 60


def validar(clases: list[Clase]) -> list[Problema]:
    """Bloques continuos de más de 5 horas — probable error de captura
    (ej: '7:00 - 20:50' en vez de dos bloques separados)."""
    problemas: list[Problema] = []

    for c in clases:
        for b in c.bloques:
            if b.duracion_min <= BLOQUE_MUY_LARGO_MIN:
                continue
            problemas.append(Problema(
                tipo="horario_sospechoso",
                severidad="media",
                descripcion=(
                    f"{c.codigo} sec {c.seccion} con {c.catedratico} tiene un bloque "
                    f"de {b.duracion_min // 60} h continuas el {b.dia} "
                    f"({minutos_a_hhmm(b.inicio)}–{minutos_a_hhmm(b.fin)}). "
                    f"¿Es correcto o son varios bloques separados?"
                ),
                referencias=[(c.fuente, c.hoja, c.fila)],
                extra={"dia": b.dia, "duracion_min": b.duracion_min},
            ))

    return problemas
