"""Verifica que la hoja consolidada coincida con la suma de las hojas por carrera.

A diferencia de otras validaciones, esta opera sobre la lista cruda de clases
incluyendo las que vienen de hojas consolidadas (cuando se solicita
explícitamente desde main.py)."""
from collections import Counter

import config
from modelo import Clase, Problema


def validar(clases_todas: list[Clase]) -> list[Problema]:
    """Compara filas en hojas consolidadas vs suma de hojas no consolidadas.

    Espera recibir TODAS las clases del archivo (incluyendo las de hojas
    consolidadas). Si no se cargaron las consolidadas, no encuentra nada
    que reportar y devuelve lista vacía."""
    conteo = Counter(c.hoja for c in clases_todas)
    consolidadas = {h: n for h, n in conteo.items() if h in config.HOJAS_CONSOLIDADAS}
    otras = {h: n for h, n in conteo.items() if h not in config.HOJAS_CONSOLIDADAS}

    if not consolidadas or not otras:
        return []

    suma_otras = sum(otras.values())

    problemas: list[Problema] = []
    for hoja_consol, n_consol in consolidadas.items():
        if n_consol == suma_otras:
            continue
        problemas.append(Problema(
            tipo="consolidacion_inconsistente",
            severidad="alta",
            descripcion=(
                f"La hoja consolidada '{hoja_consol}' tiene {n_consol} registros, "
                f"pero la suma de las hojas por carrera ({', '.join(otras)}) suma {suma_otras}. "
                f"Diferencia: {n_consol - suma_otras:+d}."
            ),
            referencias=[("PROGRAMACION", hoja_consol, 0)],
            extra={
                "hoja_consolidada": hoja_consol,
                "registros_consolidada": n_consol,
                "registros_otras": suma_otras,
            },
        ))

    return problemas
