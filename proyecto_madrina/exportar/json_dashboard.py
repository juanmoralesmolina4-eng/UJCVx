"""Exporta el estado completo del análisis a un JSON consumible por la web.

Este formato es el que más adelante alimentará a Supabase. Por ahora, la web
local lo lee directo del filesystem para mostrar datos reales en el dashboard
sin tener que reescribir el pipeline en TypeScript todavía."""
from __future__ import annotations

import json
from collections import Counter
from datetime import datetime
from pathlib import Path

from modelo import Clase, Problema
from metricas.aulas import MetricasAula
from metricas.docentes import MetricasDocente


def exportar(
    clases: list[Clase],
    problemas: list[Problema],
    metricas_aulas: list[MetricasAula],
    metricas_docentes: list[MetricasDocente],
    ruta_salida: str | Path,
) -> None:
    payload = {
        "generado_at": datetime.now().isoformat(timespec="seconds"),
        "totales": {
            "clases": len(clases),
            "catedraticos": len({c.catedratico for c in clases if c.catedratico}),
            "problemas": len(problemas),
            "aulas": len(metricas_aulas),
        },
        "problemas_por_tipo": dict(Counter(p.tipo for p in problemas)),
        "problemas": [_problema_a_dict(p) for p in problemas],
        "metricas_aulas": [_aula_a_dict(m) for m in metricas_aulas],
        "metricas_docentes": [_docente_a_dict(m) for m in metricas_docentes],
    }

    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def _problema_a_dict(p: Problema) -> dict:
    return {
        "tipo": p.tipo,
        "severidad": p.severidad,
        "descripcion": p.descripcion,
        "referencias": [
            {"fuente": f, "hoja": h, "fila": fi} for f, h, fi in p.referencias
        ],
        "extra": p.extra,
    }


def _aula_a_dict(m: MetricasAula) -> dict:
    return {
        "aula": m.aula,
        "horas_ocupadas": round(m.horas_ocupadas, 1),
        "porcentaje_ocupacion": round(m.porcentaje_ocupacion, 1),
        "n_clases": m.n_clases,
        "n_catedraticos": len(m.catedraticos),
        "horas_por_dia": {d: round(h, 1) for d, h in m.horas_por_dia.items()},
    }


def _docente_a_dict(m: MetricasDocente) -> dict:
    return {
        "catedratico": m.catedratico,
        "horas_semanales": round(m.horas_semanales, 1),
        "n_dias": m.n_dias,
        "n_clases": m.n_clases,
        "horas_huecos": round(m.horas_huecos, 1),
        "ratio_eficiencia": round(m.ratio_eficiencia * 100, 1),
        "carreras": sorted(m.carreras),
        "aulas": sorted(m.aulas),
    }
