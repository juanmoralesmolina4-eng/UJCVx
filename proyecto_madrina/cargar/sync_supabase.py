"""Sube las clases, bloques, problemas y métricas a Supabase.

Usa el `service_role` key para bypassear RLS. Lee las credenciales desde
`web/.env.local`. Es idempotente:
- Reusa el periodo si ya existe.
- Crea una nueva importación y una nueva corrida_validacion en cada corrida
  (así queda historial).
- Inserta clases nuevas vinculadas a la importación recién creada.

Uso:
    python -m cargar.sync_supabase   # desde proyecto_madrina/
"""
from __future__ import annotations

import json
import os
import ssl
from pathlib import Path
from typing import Any

from supabase import create_client, Client


RAIZ = Path(__file__).resolve().parent.parent.parent

# Bypass TLS local (mismo problema que con curl/Node — antivirus intercepta).
# En servidor real esto no es necesario.
ssl._create_default_https_context = ssl._create_unverified_context
os.environ["PYTHONHTTPSVERIFY"] = "0"
os.environ.setdefault("CURL_CA_BUNDLE", "")


def _leer_env() -> dict[str, str]:
    """Lee web/.env.local manualmente — no queremos depender de python-dotenv."""
    env: dict[str, str] = {}
    path = RAIZ / "web" / ".env.local"
    if not path.exists():
        return env
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def _cliente() -> Client:
    env = _leer_env()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en web/.env.local"
        )
    return create_client(url, key)


def _periodo_id(sb: Client, codigo: str, anio: int, numero: int) -> str:
    res = sb.table("periodos").select("id").eq("codigo", codigo).execute()
    if res.data:
        return res.data[0]["id"]
    res = sb.table("periodos").insert(
        {"codigo": codigo, "anio": anio, "numero": numero}
    ).execute()
    return res.data[0]["id"]


def _campus_de_seccion(seccion: str) -> str:
    s = seccion.upper().replace(" ", "")
    if s.endswith("-C") or s.endswith("C"):
        return "C"
    return "T"


def _modalidad_canonica(modalidad: str | None) -> str | None:
    if not modalidad:
        return None
    m = modalidad.upper().replace(" ", "").replace("-", "")
    if m.startswith("PRESEN"):
        return "PRESENCIAL"
    if m.startswith("VIRT"):
        return "VIRTUAL"
    if m.startswith("SEMI"):
        return "SEMIPRESENCIAL"
    return None


def _insertar_clases(
    sb: Client,
    clases: list[dict[str, Any]],
    periodo_id: str,
    importacion_id: str,
) -> None:
    """Inserta clases por lotes y luego sus bloques. Se hace en dos pasos
    porque necesitamos los IDs generados de las clases para los bloques."""
    if not clases:
        return

    filas_clases: list[dict[str, Any]] = []
    for c in clases:
        seccion = c["seccion"] or "?"
        filas_clases.append({
            "periodo_id": periodo_id,
            "campus_codigo": _campus_de_seccion(seccion),
            "importacion_id": importacion_id,
            "hoja_origen": c["hoja"],
            "fila_origen": c["fila"],
            "catedratico_nombre": c["catedratico"] or "SIN ASIGNAR",
            "catedratico_es_nuevo": c["catedratico_es_nuevo"],
            "codigo": c["codigo"] or "?",
            "codigos_alternos": c["codigos_alternos"] or None,
            "asignatura_nombre": c["asignatura"] or "?",
            "carrera_codigo": c["carrera"] or None,
            "alumnos": c["alumnos"],
            "modalidad": _modalidad_canonica(c["modalidad"]),
            "aula_texto": c["aula"] or "",
            "seccion": seccion,
            "horas_presenciales": c["horas_presenciales"],
            "horas_asincronicas": c["horas_asincronicas"],
            "horas_totales": c["horas_totales"],
            "observaciones": c["observaciones"] or "",
        })

    insertadas: list[dict[str, Any]] = []
    LOTE = 100
    for i in range(0, len(filas_clases), LOTE):
        chunk = filas_clases[i:i + LOTE]
        res = sb.table("clases").insert(chunk).execute()
        insertadas.extend(res.data)

    filas_bloques: list[dict[str, Any]] = []
    for clase_db, clase_src in zip(insertadas, clases):
        for b in clase_src["bloques"]:
            filas_bloques.append({
                "clase_id": clase_db["id"],
                "dia": b["dia"],
                "inicio_min": b["inicio_min"],
                "fin_min": b["fin_min"],
            })

    if filas_bloques:
        for i in range(0, len(filas_bloques), LOTE):
            chunk = filas_bloques[i:i + LOTE]
            sb.table("bloques_horarios").insert(chunk).execute()


def sync(json_path: Path | None = None) -> None:
    json_path = json_path or RAIZ / "web" / "data" / "dashboard.json"
    if not json_path.exists():
        raise RuntimeError(f"No existe {json_path}. Corre primero `python main.py`.")

    data = json.loads(json_path.read_text(encoding="utf-8"))

    print(f"Conectando a Supabase...")
    sb = _cliente()

    print(f"Asegurando periodo II-2026...")
    periodo_id = _periodo_id(sb, codigo="2026-II", anio=2026, numero=2)

    print(f"Creando registro de importación...")
    importacion = sb.table("importaciones").insert({
        "tipo": "programacion",
        "archivo": "PROGRAMACIÓN ACADÉMICA II PERÍODO 2026 (1).xlsx",
        "periodo_id": periodo_id,
        "total_filas": data["totales"]["clases"],
        "status": "completada",
    }).execute()
    importacion_id = importacion.data[0]["id"]

    print(f"Insertando {len(data['clases'])} clases + bloques...")
    _insertar_clases(sb, data["clases"], periodo_id, importacion_id)

    print(f"Creando corrida de validación...")
    corrida = sb.table("corridas_validacion").insert({
        "periodo_id": periodo_id,
        "total_clases": data["totales"]["clases"],
        "total_problemas": data["totales"]["problemas"],
        "resumen": data["problemas_por_tipo"],
    }).execute()
    corrida_id = corrida.data[0]["id"]

    if data["problemas"]:
        print(f"Insertando {len(data['problemas'])} problemas...")
        filas_problemas: list[dict[str, Any]] = []
        for p in data["problemas"]:
            filas_problemas.append({
                "corrida_id": corrida_id,
                "tipo": p["tipo"],
                "severidad": p["severidad"],
                "descripcion": p["descripcion"],
                "referencias": p["referencias"],
                "extra": p["extra"],
            })
        sb.table("problemas").insert(filas_problemas).execute()

    print(f"Subiendo archivos generados al bucket uploads/outputs/{importacion_id[:8]}.../")
    _subir_archivos_generados(sb, importacion_id)

    print()
    print(f"OK — importación {importacion_id[:8]}, corrida {corrida_id[:8]}")
    print(f"   {data['totales']['clases']} clases, {data['totales']['problemas']} problemas")


# Mapeo nombre_archivo_local -> nombre_lógico (usado en URL de descarga)
ARCHIVOS_GENERADOS = {
    "Reporte_validacion.xlsx": "validacion",
    "Programacion_normalizada.xlsx": "normalizado",
    "Programacion_normalizada.csv": "csv",
    "Pago_RRHH_borrador.xlsx": "pago",
    "Reporte_metricas.xlsx": "metricas",
}

CONTENT_TYPES = {
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".csv": "text/csv",
}


def _subir_archivos_generados(sb: Client, importacion_id: str) -> None:
    """Sube los archivos de salida del pipeline al bucket `uploads` bajo
    `outputs/{importacion_id}/`. Estos archivos son los que la web ofrece
    para descarga."""
    for nombre_local, nombre_logico in ARCHIVOS_GENERADOS.items():
        ruta_local = RAIZ / nombre_local
        if not ruta_local.exists():
            print(f"  ! {nombre_local} no existe, salto")
            continue

        ext = ruta_local.suffix
        content_type = CONTENT_TYPES.get(ext, "application/octet-stream")
        object_path = f"outputs/{importacion_id}/{nombre_logico}{ext}"

        contenido = ruta_local.read_bytes()
        sb.storage.from_("uploads").upload(
            object_path,
            contenido,
            {"content-type": content_type, "upsert": "true"},
        )
        print(f"  OK {nombre_logico}{ext} ({len(contenido) // 1024} KB)")


if __name__ == "__main__":
    sync()
