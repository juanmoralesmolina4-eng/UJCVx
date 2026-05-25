from collections import defaultdict
from itertools import combinations

from modelo import Clase, Problema
from normalizar import minutos_a_hhmm


def _se_solapan(a, b) -> bool:
    return a.inicio < b.fin and b.inicio < a.fin


def _firma_clase(c: Clase) -> tuple[str, str, str]:
    return (c.catedratico, c.codigo, c.seccion)


def validar(clases: list[Clase]) -> list[Problema]:
    return _solapes_aula(clases) + _solapes_catedratico(clases)


def _solapes_aula(clases: list[Clase]) -> list[Problema]:
    """Misma aula física, mismo día, horarios que se cruzan."""
    por_aula_dia = defaultdict(list)
    for c in clases:
        if c.es_virtual or not c.aula:
            continue
        for b in c.bloques:
            por_aula_dia[(c.aula, b.dia)].append((c, b))

    problemas: list[Problema] = []
    for (aula, dia), items in por_aula_dia.items():
        for (c1, b1), (c2, b2) in combinations(items, 2):
            if _firma_clase(c1) == _firma_clase(c2):
                continue
            if not _se_solapan(b1, b2):
                continue
            problemas.append(Problema(
                tipo="solape_aula",
                severidad="alta",
                descripcion=(
                    f"Aula {aula} ocupada el {dia} por dos clases distintas: "
                    f"{c1.codigo} sec {c1.seccion} ({minutos_a_hhmm(b1.inicio)}–{minutos_a_hhmm(b1.fin)}) "
                    f"y {c2.codigo} sec {c2.seccion} ({minutos_a_hhmm(b2.inicio)}–{minutos_a_hhmm(b2.fin)})."
                ),
                referencias=[(c1.fuente, c1.hoja, c1.fila), (c2.fuente, c2.hoja, c2.fila)],
                extra={"aula": aula, "dia": dia},
            ))

    return problemas


def _solapes_catedratico(clases: list[Clase]) -> list[Problema]:
    """Mismo catedrático, mismo día, horarios que se cruzan, en clases distintas."""
    por_cated_dia = defaultdict(list)
    for c in clases:
        if not c.catedratico or c.catedratico == "P.D.":
            continue
        for b in c.bloques:
            por_cated_dia[(c.catedratico, b.dia)].append((c, b))

    problemas: list[Problema] = []
    for (cated, dia), items in por_cated_dia.items():
        for (c1, b1), (c2, b2) in combinations(items, 2):
            if _firma_clase(c1) == _firma_clase(c2):
                continue
            if not _se_solapan(b1, b2):
                continue
            problemas.append(Problema(
                tipo="solape_catedratico",
                severidad="alta",
                descripcion=(
                    f"{cated} tiene dos clases simultáneas el {dia}: "
                    f"{c1.codigo} sec {c1.seccion} ({minutos_a_hhmm(b1.inicio)}–{minutos_a_hhmm(b1.fin)}) "
                    f"y {c2.codigo} sec {c2.seccion} ({minutos_a_hhmm(b2.inicio)}–{minutos_a_hhmm(b2.fin)})."
                ),
                referencias=[(c1.fuente, c1.hoja, c1.fila), (c2.fuente, c2.hoja, c2.fila)],
                extra={"catedratico": cated, "dia": dia},
            ))

    return problemas
