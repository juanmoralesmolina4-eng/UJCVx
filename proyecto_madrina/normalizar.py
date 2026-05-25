import re
from typing import Optional

from modelo import Bloque


_RE_HORA = re.compile(r"(\d{1,2})[:\.](\d{2})")


def texto(valor) -> str:
    if valor is None:
        return ""
    return str(valor).replace("\n", " ").strip()


def nombre_catedratico(valor) -> tuple[str, bool]:
    """Normaliza el nombre del catedrático y detecta el marcador (NUEVO)."""
    raw = texto(valor).upper()
    if not raw:
        return "", False
    es_nuevo = "(NUEVO)" in raw
    nombre = raw.replace("(NUEVO)", "").strip()
    nombre = re.sub(r"\s+", " ", nombre)
    return nombre, es_nuevo


def codigos(valor) -> tuple[str, list[str]]:
    """Una celda puede traer 'ICI3120 / ICI3117' o 'ADM2011 /ADM2015'. Devuelve principal + alternos."""
    raw = texto(valor)
    if not raw:
        return "", []
    partes = re.split(r"[\/,]", raw)
    limpios = [p.strip().upper() for p in partes if p.strip()]
    if not limpios:
        return "", []
    return limpios[0], limpios[1:]


def alumnos(valor) -> Optional[int]:
    """Suma '12 + 5' a 17. Devuelve None si no es interpretable."""
    if valor is None or valor == "":
        return None
    if isinstance(valor, (int, float)):
        return int(valor)
    raw = texto(valor).replace(" ", "")
    if not raw:
        return None
    numeros = re.findall(r"\d+", raw)
    if not numeros:
        return None
    return sum(int(n) for n in numeros)


def horas(valor) -> Optional[float]:
    if valor is None or valor == "":
        return None
    if isinstance(valor, (int, float)):
        return float(valor)
    raw = texto(valor)
    try:
        return float(raw)
    except ValueError:
        return None


def bloques_dia(dia: str, valor) -> list[Bloque]:
    """Una celda de día puede traer uno o más rangos: '7:00 - 8:50', '8:00-9:50 LAB',
    '13:00 - 14:50\\n15:00 - 16:50', '7:00 10:50' (sin guion), etc."""
    raw = texto(valor)
    if not raw:
        return []

    raw_limpio = re.sub(r"(?i)\b(virtual|lab|laboratorio|presencial)\b", " ", raw)

    horas_encontradas = _RE_HORA.findall(raw_limpio)
    if len(horas_encontradas) < 2:
        return []

    minutos = [int(h) * 60 + int(m) for h, m in horas_encontradas]

    bloques = []
    for i in range(0, len(minutos) - 1, 2):
        inicio, fin = minutos[i], minutos[i + 1]
        if fin <= inicio:
            continue
        bloques.append(Bloque(dia=dia, inicio=inicio, fin=fin))

    return bloques


def aula(valor) -> str:
    raw = texto(valor).upper()
    return re.sub(r"\s+", " ", raw)


def seccion(valor) -> str:
    raw = texto(valor).upper().replace(" ", "")
    return raw


def minutos_a_hhmm(m: int) -> str:
    return f"{m // 60:02d}:{m % 60:02d}"
