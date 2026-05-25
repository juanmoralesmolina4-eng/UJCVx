"""Tests de las validaciones críticas.

Corre con: python test_validaciones.py
"""
from modelo import Clase, Bloque
from validaciones import duplicados, solapes, horas, sobrecarga, secciones_grandes


def _clase(
    *,
    hoja="UDAC", fila=8,
    catedratico="JUAN PEREZ", codigo="MAT1014", asignatura="ALGEBRA",
    carrera="FIS-MAT", alumnos=20, modalidad="PRESENCIAL",
    aula="202", seccion="A-T",
    h_pres=4.0, h_asin=0.0, h_tot=4.0,
    bloques=(),
):
    return Clase(
        fuente="TEST", hoja=hoja, fila=fila,
        numero=1, catedratico=catedratico, catedratico_es_nuevo=False,
        codigo=codigo, codigos_alternos=[],
        asignatura=asignatura, carrera=carrera,
        alumnos=alumnos, modalidad=modalidad, aula=aula, seccion=seccion,
        horas_presenciales=h_pres, horas_asincronicas=h_asin, horas_totales=h_tot,
        bloques=list(bloques),
    )


# ============== duplicados ==============

def test_duplicados_detecta_par_exacto():
    c1 = _clase(fila=10)
    c2 = _clase(fila=20)  # mismo catedrático + código + sección
    problemas = duplicados.validar([c1, c2])
    assert len(problemas) == 1
    assert problemas[0].tipo == "duplicado"
    assert len(problemas[0].referencias) == 2


def test_duplicados_ignora_distinta_seccion():
    c1 = _clase(seccion="A-T")
    c2 = _clase(seccion="B-T")
    assert duplicados.validar([c1, c2]) == []


def test_duplicados_ignora_distinto_codigo():
    c1 = _clase(codigo="MAT1014")
    c2 = _clase(codigo="MAT1015")
    assert duplicados.validar([c1, c2]) == []


def test_duplicados_ignora_distinto_catedratico():
    c1 = _clase(catedratico="JUAN PEREZ")
    c2 = _clase(catedratico="MARIA LOPEZ")
    assert duplicados.validar([c1, c2]) == []


# ============== solapes ==============

def test_solape_aula_detecta_cruce_simple():
    c1 = _clase(catedratico="A", codigo="X", seccion="A-T", aula="202",
                bloques=[Bloque("LUN", 7*60, 9*60)])
    c2 = _clase(catedratico="B", codigo="Y", seccion="A-T", aula="202",
                bloques=[Bloque("LUN", 8*60, 10*60)])
    problemas = solapes.validar([c1, c2])
    tipos = {p.tipo for p in problemas}
    assert "solape_aula" in tipos


def test_solape_aula_no_aplica_a_virtual():
    c1 = _clase(catedratico="A", codigo="X", seccion="A-T", aula="VIRTUAL",
                bloques=[Bloque("LUN", 7*60, 9*60)])
    c2 = _clase(catedratico="B", codigo="Y", seccion="A-T", aula="VIRTUAL",
                bloques=[Bloque("LUN", 8*60, 10*60)])
    problemas = solapes.validar([c1, c2])
    assert not any(p.tipo == "solape_aula" for p in problemas)


def test_solape_aula_no_detecta_clases_consecutivas():
    """Dos clases en la misma aula que terminan/empiezan juntas NO solapan."""
    c1 = _clase(catedratico="A", codigo="X", seccion="A-T", aula="202",
                bloques=[Bloque("LUN", 7*60, 9*60)])
    c2 = _clase(catedratico="B", codigo="Y", seccion="A-T", aula="202",
                bloques=[Bloque("LUN", 9*60, 11*60)])
    problemas = solapes.validar([c1, c2])
    assert not any(p.tipo == "solape_aula" for p in problemas)


def test_solape_catedratico_detecta_dos_clases_simultaneas():
    c1 = _clase(catedratico="JUAN", codigo="X", seccion="A-T",
                bloques=[Bloque("MAR", 8*60, 10*60)])
    c2 = _clase(catedratico="JUAN", codigo="Y", seccion="A-T",
                bloques=[Bloque("MAR", 9*60, 11*60)])
    problemas = solapes.validar([c1, c2])
    assert any(p.tipo == "solape_catedratico" for p in problemas)


def test_solape_catedratico_ignora_pd():
    c1 = _clase(catedratico="P.D.", codigo="X", seccion="A-T",
                bloques=[Bloque("MAR", 8*60, 10*60)])
    c2 = _clase(catedratico="P.D.", codigo="Y", seccion="A-T",
                bloques=[Bloque("MAR", 9*60, 11*60)])
    problemas = solapes.validar([c1, c2])
    assert not any(p.tipo == "solape_catedratico" for p in problemas)


def test_solape_catedratico_dias_distintos_no_choca():
    c1 = _clase(catedratico="JUAN", codigo="X", seccion="A-T",
                bloques=[Bloque("MAR", 8*60, 10*60)])
    c2 = _clase(catedratico="JUAN", codigo="Y", seccion="A-T",
                bloques=[Bloque("MIE", 8*60, 10*60)])
    problemas = solapes.validar([c1, c2])
    assert not any(p.tipo == "solape_catedratico" for p in problemas)


# ============== horas ==============

def test_horas_sobreprogramada():
    """Declara 4 horas totales pero los bloques suman 6 horas clase."""
    c = _clase(h_tot=4.0, h_pres=4.0,
               bloques=[Bloque("LUN", 7*60, 12*60+50)])  # 6 horas clase
    problemas = horas.validar([c])
    assert len(problemas) == 1
    assert "sobre-programada" in problemas[0].descripcion


def test_horas_subprogramada():
    """Declara 6 horas presenciales pero los bloques suman solo 2 horas clase."""
    c = _clase(h_pres=6.0, h_tot=6.0,
               bloques=[Bloque("LUN", 7*60, 8*60+50)])  # 2 horas clase
    problemas = horas.validar([c])
    assert len(problemas) == 1
    assert "sub-programada" in problemas[0].descripcion


def test_horas_clase_async_no_marca_problema():
    """Clase con async + presencial: si bloques == presencial, OK."""
    c = _clase(h_pres=3.0, h_asin=3.0, h_tot=6.0,
               bloques=[Bloque("LUN", 7*60, 9*60+50)])  # 3 horas clase
    problemas = horas.validar([c])
    assert problemas == []


def test_horas_sin_bloques_pero_con_presenciales():
    c = _clase(h_pres=4.0, h_tot=4.0, bloques=[])
    problemas = horas.validar([c])
    assert len(problemas) == 1
    assert "no tiene" in problemas[0].descripcion


# ============== sobrecarga ==============

def test_sobrecarga_suma_clases_del_mismo_docente():
    """Tres clases de 15 h cada una = 45 h > 40 umbral."""
    c1 = _clase(catedratico="X", codigo="A", seccion="A-T", h_tot=15.0)
    c2 = _clase(catedratico="X", codigo="B", seccion="A-T", h_tot=15.0)
    c3 = _clase(catedratico="X", codigo="C", seccion="A-T", h_tot=15.0)
    problemas = sobrecarga.validar([c1, c2, c3])
    assert len(problemas) == 1
    assert problemas[0].extra["horas_totales"] == 45.0


def test_sobrecarga_no_marca_bajo_umbral():
    c1 = _clase(catedratico="X", codigo="A", seccion="A-T", h_tot=20.0)
    c2 = _clase(catedratico="X", codigo="B", seccion="B-T", h_tot=15.0)
    problemas = sobrecarga.validar([c1, c2])
    assert problemas == []


# ============== secciones_grandes ==============

def test_seccion_grande_detecta_excedido():
    c = _clase(alumnos=40)
    problemas = secciones_grandes.validar([c])
    assert len(problemas) == 1


def test_seccion_grande_ignora_bajo_umbral():
    c = _clase(alumnos=15)
    assert secciones_grandes.validar([c]) == []


# ============== runner ==============

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
