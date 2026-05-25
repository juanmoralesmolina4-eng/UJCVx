from modelo import Clase, Problema


def validar(clases: list[Clase]) -> list[Problema]:
    """Detecta inconsistencias entre las horas declaradas y los bloques de horario.

    Una clase puede tener horas asincrónicas sin bloque fijo, por eso comparar
    contra horas_totales genera falsos positivos. Reglas usadas:

    - Sobre-programada: la suma de bloques excede las horas TOTALES declaradas.
    - Sub-programada: la suma de bloques es menor que las horas PRESENCIALES
      declaradas (faltan bloques que deberían existir).
    - Sin horario: declara horas presenciales pero no tiene ningún bloque."""
    problemas: list[Problema] = []

    for c in clases:
        pres = c.horas_presenciales
        tot = c.horas_totales
        reales = c.horas_reales_semanales

        if pres is None and tot is None:
            continue

        if not c.bloques:
            if pres and pres > 0:
                problemas.append(Problema(
                    tipo="horas_inconsistentes",
                    severidad="alta",
                    descripcion=(
                        f"{c.codigo} sec {c.seccion} con {c.catedratico} declara "
                        f"{pres} h presenciales pero no tiene ningún bloque de horario."
                    ),
                    referencias=[(c.fuente, c.hoja, c.fila)],
                    extra={"declaradas_pres": pres, "reales": 0},
                ))
            continue

        if tot is not None and reales > tot:
            problemas.append(Problema(
                tipo="horas_inconsistentes",
                severidad="media",
                descripcion=(
                    f"{c.codigo} sec {c.seccion} con {c.catedratico} declara "
                    f"{tot} h totales pero los bloques de horario suman {reales} h clase (sobre-programada)."
                ),
                referencias=[(c.fuente, c.hoja, c.fila)],
                extra={"declaradas_tot": tot, "reales": reales, "exceso": reales - tot},
            ))
            continue

        if pres is not None and pres > 0 and reales < pres:
            problemas.append(Problema(
                tipo="horas_inconsistentes",
                severidad="media",
                descripcion=(
                    f"{c.codigo} sec {c.seccion} con {c.catedratico} declara "
                    f"{pres} h presenciales pero los bloques de horario suman solo {reales} h clase (sub-programada)."
                ),
                referencias=[(c.fuente, c.hoja, c.fila)],
                extra={"declaradas_pres": pres, "reales": reales, "faltante": pres - reales},
            ))

    return problemas
