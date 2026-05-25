"""Métricas de eficiencia docente — "optimización docente" que Martha pidió.

Para cada catedrático calcula:
- horas semanales totales (suma de bloques)
- días distintos que trabaja
- ventana del día (primer inicio - último fin) por día
- huecos: tiempo "muerto" entre clases que no se aprovecha
- carreras y modalidades que toca

El indicador clave de eficiencia es el ratio:
    horas_clase / ventana_del_dia
Un docente con muchos huecos largos tiene ratio bajo (ineficiente: pasa
horas en campus sin clase). Un docente con clases consecutivas tiene
ratio alto."""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field

from modelo import Clase, Bloque, DIAS


@dataclass
class MetricasDocente:
    catedratico: str
    horas_semanales: float = 0.0
    n_clases: int = 0
    dias_trabajados: set[str] = field(default_factory=set)
    carreras: set[str] = field(default_factory=set)
    modalidades: set[str] = field(default_factory=set)
    aulas: set[str] = field(default_factory=set)
    bloques: list[Bloque] = field(default_factory=list)

    @property
    def n_dias(self) -> int:
        return len(self.dias_trabajados)

    @property
    def ventanas_por_dia(self) -> dict[str, tuple[int, int]]:
        """Para cada día: (primer inicio, último fin) en minutos."""
        por_dia: dict[str, list[Bloque]] = defaultdict(list)
        for b in self.bloques:
            por_dia[b.dia].append(b)
        return {
            d: (min(b.inicio for b in lst), max(b.fin for b in lst))
            for d, lst in por_dia.items()
        }

    @property
    def horas_huecos(self) -> float:
        """Tiempo total entre clases del mismo día que no es clase."""
        por_dia: dict[str, list[Bloque]] = defaultdict(list)
        for b in self.bloques:
            por_dia[b.dia].append(b)

        huecos_min = 0
        for dia_bloques in por_dia.values():
            ordenados = sorted(dia_bloques, key=lambda b: b.inicio)
            for prev, sig in zip(ordenados, ordenados[1:]):
                gap = sig.inicio - prev.fin
                if gap > 0:
                    huecos_min += gap
        return huecos_min / 60

    @property
    def ratio_eficiencia(self) -> float:
        """Horas de clase ÷ horas de presencia en campus (clase + huecos).
        1.0 = sin huecos. 0.5 = la mitad del tiempo en campus es hueco."""
        en_campus = self.horas_semanales + self.horas_huecos
        if en_campus == 0:
            return 0.0
        return self.horas_semanales / en_campus


def calcular(clases: list[Clase]) -> list[MetricasDocente]:
    por_cated: dict[str, MetricasDocente] = {}

    for c in clases:
        if not c.catedratico or c.catedratico == "P.D.":
            continue
        m = por_cated.setdefault(c.catedratico, MetricasDocente(catedratico=c.catedratico))
        m.n_clases += 1
        if c.carrera:
            m.carreras.add(c.carrera)
        if c.modalidad:
            m.modalidades.add(c.modalidad)
        if c.aula:
            m.aulas.add(c.aula)
        for b in c.bloques:
            m.bloques.append(b)
            m.horas_semanales += b.duracion_min / 60
            m.dias_trabajados.add(b.dia)

    return sorted(por_cated.values(), key=lambda m: -m.horas_semanales)


def resumen_global(metricas: list[MetricasDocente]) -> dict:
    if not metricas:
        return {"n_docentes": 0}

    return {
        "n_docentes": len(metricas),
        "horas_promedio": round(sum(m.horas_semanales for m in metricas) / len(metricas), 1),
        "docentes_con_huecos_grandes": [
            (m.catedratico, round(m.horas_huecos, 1))
            for m in metricas if m.horas_huecos > 4
        ],
        "docentes_baja_eficiencia": [
            (m.catedratico, round(m.ratio_eficiencia * 100, 1))
            for m in metricas if m.ratio_eficiencia < 0.7 and m.horas_semanales > 0
        ],
    }
