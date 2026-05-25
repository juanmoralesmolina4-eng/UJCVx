import math
from dataclasses import dataclass, field
from typing import Optional

DIAS = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"]


@dataclass
class Bloque:
    """Un bloque horario en un día concreto, en minutos desde medianoche."""
    dia: str
    inicio: int
    fin: int

    @property
    def duracion_min(self) -> int:
        return self.fin - self.inicio

    @property
    def horas_clase(self) -> int:
        """Cuenta horas clase de 50 min: '7:00–8:50' = 2 horas (7–7:50 y 8–8:50)."""
        return math.ceil(self.duracion_min / 60)


@dataclass
class Clase:
    """Una sección de clase normalizada, agnóstica de la fuente."""
    fuente: str
    hoja: str
    fila: int

    numero: Optional[int]
    catedratico: str
    catedratico_es_nuevo: bool
    codigo: str
    codigos_alternos: list[str]
    asignatura: str
    carrera: str
    alumnos: Optional[int]
    modalidad: str
    aula: str
    seccion: str
    horas_presenciales: Optional[float]
    horas_asincronicas: Optional[float]
    horas_totales: Optional[float]
    bloques: list[Bloque] = field(default_factory=list)
    observaciones: str = ""

    @property
    def es_virtual(self) -> bool:
        return "VIRTUAL" in self.aula.upper()

    @property
    def horas_reales_semanales(self) -> int:
        """Total de horas clase semanales según los bloques de horario."""
        return sum(b.horas_clase for b in self.bloques)


@dataclass
class Problema:
    """Un hallazgo de una validación, listo para reportar."""
    tipo: str
    severidad: str
    descripcion: str
    referencias: list[tuple[str, str, int]]
    extra: dict = field(default_factory=dict)
