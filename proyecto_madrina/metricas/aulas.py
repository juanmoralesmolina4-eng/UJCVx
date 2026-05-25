"""Métricas de eficiencia de aulas — "optimización de espacios" que Martha pidió.

Para cada aula física se calcula:
- horas ocupadas a la semana (suma de bloques)
- % de ocupación sobre una jornada de referencia
- distribución por día (qué tan parejo es el uso)
- horario pico (cuándo se llena)

Convenciones por defecto:
- Jornada de referencia: 7:00 a 21:00 lunes a sábado = 14 h × 6 días = 84 h/semana.
- Aulas virtuales se excluyen del análisis (no son recursos físicos)."""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field

from modelo import Clase, DIAS


JORNADA_INICIO_MIN = 7 * 60
JORNADA_FIN_MIN = 21 * 60
DIAS_LABORABLES = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"]

HORAS_JORNADA_SEMANA = (
    (JORNADA_FIN_MIN - JORNADA_INICIO_MIN) / 60 * len(DIAS_LABORABLES)
)


@dataclass
class MetricasAula:
    aula: str
    horas_ocupadas: float = 0.0
    horas_por_dia: dict[str, float] = field(default_factory=lambda: {d: 0.0 for d in DIAS})
    n_clases: int = 0
    catedraticos: set[str] = field(default_factory=set)

    @property
    def porcentaje_ocupacion(self) -> float:
        return 100 * self.horas_ocupadas / HORAS_JORNADA_SEMANA

    @property
    def dia_mas_usado(self) -> tuple[str, float]:
        return max(self.horas_por_dia.items(), key=lambda kv: kv[1])

    @property
    def dia_menos_usado(self) -> tuple[str, float]:
        return min(self.horas_por_dia.items(), key=lambda kv: kv[1])


def calcular(clases: list[Clase]) -> list[MetricasAula]:
    """Calcula métricas por aula. Las aulas virtuales se excluyen."""
    por_aula: dict[str, MetricasAula] = {}

    for c in clases:
        if c.es_virtual or not c.aula:
            continue
        m = por_aula.setdefault(c.aula, MetricasAula(aula=c.aula))
        m.n_clases += 1
        if c.catedratico:
            m.catedraticos.add(c.catedratico)
        for b in c.bloques:
            horas = b.duracion_min / 60
            m.horas_ocupadas += horas
            m.horas_por_dia[b.dia] = m.horas_por_dia.get(b.dia, 0.0) + horas

    return sorted(por_aula.values(), key=lambda m: -m.porcentaje_ocupacion)


def resumen_global(metricas: list[MetricasAula]) -> dict:
    """Métricas agregadas para mostrar en el dashboard."""
    if not metricas:
        return {
            "n_aulas": 0,
            "horas_totales_ocupadas": 0.0,
            "ocupacion_promedio": 0.0,
            "subutilizadas": [],
            "sobreutilizadas": [],
        }

    subutilizadas = [m for m in metricas if m.porcentaje_ocupacion < 25]
    sobreutilizadas = [m for m in metricas if m.porcentaje_ocupacion > 90]
    ocupacion_promedio = sum(m.porcentaje_ocupacion for m in metricas) / len(metricas)

    return {
        "n_aulas": len(metricas),
        "horas_totales_ocupadas": sum(m.horas_ocupadas for m in metricas),
        "ocupacion_promedio": round(ocupacion_promedio, 1),
        "subutilizadas": [(m.aula, round(m.porcentaje_ocupacion, 1)) for m in subutilizadas],
        "sobreutilizadas": [(m.aula, round(m.porcentaje_ocupacion, 1)) for m in sobreutilizadas],
    }
