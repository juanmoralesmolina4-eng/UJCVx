"""Tests del normalizador. Correr con: python -m pytest test_normalizar.py -v
O sin pytest: python test_normalizar.py
"""
import normalizar


def test_texto():
    assert normalizar.texto(None) == ""
    assert normalizar.texto("") == ""
    assert normalizar.texto("  hola  ") == "hola"
    assert normalizar.texto("línea1\nlínea2") == "línea1 línea2"
    assert normalizar.texto(42) == "42"


def test_nombre_catedratico():
    assert normalizar.nombre_catedratico(None) == ("", False)
    assert normalizar.nombre_catedratico("") == ("", False)
    assert normalizar.nombre_catedratico("juan perez") == ("JUAN PEREZ", False)
    assert normalizar.nombre_catedratico("  JUAN   PEREZ  ") == ("JUAN PEREZ", False)
    assert normalizar.nombre_catedratico("JUAN PEREZ (NUEVO)") == ("JUAN PEREZ", True)
    assert normalizar.nombre_catedratico("MARIA (NUEVO) LOPEZ") == ("MARIA LOPEZ", True)


def test_codigos_simple():
    assert normalizar.codigos("ARQ4304") == ("ARQ4304", [])
    assert normalizar.codigos("  mat1014  ") == ("MAT1014", [])
    assert normalizar.codigos("") == ("", [])
    assert normalizar.codigos(None) == ("", [])


def test_codigos_multiples():
    assert normalizar.codigos("ICI3120 / ICI3117") == ("ICI3120", ["ICI3117"])
    assert normalizar.codigos("ADM2011 /ADM2015") == ("ADM2011", ["ADM2015"])
    assert normalizar.codigos("A / B / C") == ("A", ["B", "C"])
    assert normalizar.codigos("A, B") == ("A", ["B"])


def test_alumnos_numericos():
    assert normalizar.alumnos(None) is None
    assert normalizar.alumnos("") is None
    assert normalizar.alumnos(15) == 15
    assert normalizar.alumnos(15.0) == 15
    assert normalizar.alumnos("15") == 15


def test_alumnos_suma():
    assert normalizar.alumnos("12 + 5") == 17
    assert normalizar.alumnos("12+5") == 17
    assert normalizar.alumnos(" 20  + 13 ") == 33
    assert normalizar.alumnos("21 + 1 + 2") == 24


def test_alumnos_no_interpretable():
    assert normalizar.alumnos("abc") is None
    assert normalizar.alumnos("   ") is None


def test_horas():
    assert normalizar.horas(None) is None
    assert normalizar.horas("") is None
    assert normalizar.horas(3) == 3.0
    assert normalizar.horas(3.5) == 3.5
    assert normalizar.horas("3") == 3.0
    assert normalizar.horas("3.5") == 3.5
    assert normalizar.horas("abc") is None


def test_bloques_dia_vacio():
    assert normalizar.bloques_dia("LUN", None) == []
    assert normalizar.bloques_dia("LUN", "") == []
    assert normalizar.bloques_dia("LUN", "   ") == []


def test_bloques_dia_rango_simple():
    bloques = normalizar.bloques_dia("LUN", "7:00 - 8:50")
    assert len(bloques) == 1
    assert bloques[0].dia == "LUN"
    assert bloques[0].inicio == 7 * 60
    assert bloques[0].fin == 8 * 60 + 50


def test_bloques_dia_sin_guion():
    """En el Excel real aparecen casos como '7:00 10:50' sin guion."""
    bloques = normalizar.bloques_dia("MAR", "7:00 10:50")
    assert len(bloques) == 1
    assert bloques[0].inicio == 7 * 60
    assert bloques[0].fin == 10 * 60 + 50


def test_bloques_dia_con_cero_inicial():
    bloques = normalizar.bloques_dia("MIE", "07:00 - 08:50")
    assert len(bloques) == 1
    assert bloques[0].inicio == 7 * 60


def test_bloques_dia_con_anotaciones():
    """El Excel trae cosas como '7:00 - 9:50 LAB' o '13:00 - 15:50 virtual'."""
    bloques = normalizar.bloques_dia("LUN", "7:00 - 9:50 LAB")
    assert len(bloques) == 1
    assert bloques[0].inicio == 7 * 60
    assert bloques[0].fin == 9 * 60 + 50

    bloques2 = normalizar.bloques_dia("MAR", "13:00 - 15:50 virtual")
    assert len(bloques2) == 1
    assert bloques2[0].inicio == 13 * 60
    assert bloques2[0].fin == 15 * 60 + 50


def test_bloques_dia_dos_rangos():
    bloques = normalizar.bloques_dia("LUN", "7:00 - 8:50\n9:00 - 10:50")
    assert len(bloques) == 2
    assert bloques[0].inicio == 7 * 60
    assert bloques[1].inicio == 9 * 60


def test_bloques_dia_invertido():
    """fin antes que inicio: se descarta."""
    bloques = normalizar.bloques_dia("LUN", "10:00 - 8:00")
    assert bloques == []


def test_aula():
    assert normalizar.aula(None) == ""
    assert normalizar.aula(202) == "202"
    assert normalizar.aula("  LAB CAD  ") == "LAB CAD"
    assert normalizar.aula("LAB    CAD") == "LAB CAD"
    assert normalizar.aula("virtual") == "VIRTUAL"
    assert normalizar.aula("211 ADM") == "211 ADM"


def test_seccion():
    assert normalizar.seccion("A-T") == "A-T"
    assert normalizar.seccion(" a-t ") == "A-T"
    assert normalizar.seccion("SED - L-T") == "SED-L-T"
    assert normalizar.seccion("AT") == "AT"


def test_minutos_a_hhmm():
    assert normalizar.minutos_a_hhmm(0) == "00:00"
    assert normalizar.minutos_a_hhmm(7 * 60) == "07:00"
    assert normalizar.minutos_a_hhmm(13 * 60 + 30) == "13:30"
    assert normalizar.minutos_a_hhmm(23 * 60 + 59) == "23:59"


def _run_all():
    tests = [(n, f) for n, f in globals().items() if n.startswith("test_")]
    fallos = []
    for nombre, func in tests:
        try:
            func()
            print(f"  OK  {nombre}")
        except AssertionError as e:
            fallos.append((nombre, e))
            print(f"  FAIL {nombre}: {e}")
        except Exception as e:
            fallos.append((nombre, e))
            print(f"  ERR {nombre}: {type(e).__name__}: {e}")
    print()
    print(f"{len(tests) - len(fallos)} / {len(tests)} pasaron")
    return 0 if not fallos else 1


if __name__ == "__main__":
    import sys
    sys.exit(_run_all())
