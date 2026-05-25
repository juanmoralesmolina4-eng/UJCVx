"""Configuración central del pipeline.

Toda constante ajustable vive aquí, no dispersa por los módulos.
Cuando este código se mueva al backend Next.js, este archivo se vuelve
la fuente de verdad para los defaults y se podrán sobrescribir por
parámetro desde la UI/API."""

# ─── Validaciones ──────────────────────────────────────────────────

# Sobrecarga: catedráticos con más horas semanales que este umbral.
UMBRAL_SOBRECARGA_H_SEMANA = 40

# Subutilización: catedráticos con menos horas semanales que este umbral.
UMBRAL_SUBUTILIZACION_H_SEMANA = 4

# Sección "grande": alumnos por encima de este umbral.
UMBRAL_SECCION_GRANDE = 30

# Bloque continuo "sospechoso": más de este número de minutos sin corte.
UMBRAL_BLOQUE_LARGO_MIN = 5 * 60


# ─── Carga ────────────────────────────────────────────────────────

# Hojas que son consolidados (repiten filas de las hojas por carrera).
# Si el archivo trae varias hojas y aparece alguna de estas, se omite.
HOJAS_CONSOLIDADAS = frozenset({"PREGRADO-IA", "PROGRAMACION GENERAL"})

# Cuántas filas vacías seguidas detener la lectura de una hoja.
LIMITE_FILAS_VACIAS_SEGUIDAS = 3

# Hasta qué fila buscar el encabezado de una hoja.
MAX_FILAS_BUSCAR_ENCABEZADO = 15


# ─── Pago ─────────────────────────────────────────────────────────

# Tarifa por hora clase por defecto en lempiras. Idealmente viene de la
# tabla `catedraticos` pero como fallback se usa este valor.
TARIFA_POR_HORA_DEFAULT_LPS = 230.0

# Semanas a pagar en cada uno de los pagos parciales del período.
# El I PAC normalmente paga 4 semanas, el II PAC paga 4, el III PAC paga 4.
SEMANAS_POR_PAGO_DEFAULT = 4

# Deducciones por defecto (proporciones sobre total de ingresos).
# Estas son aproximadas — pueden ajustarse o calcularse exactamente más adelante.
PORCENTAJE_IHSS = 0.025  # 2.5% del ingreso, hasta el techo del IHSS
TECHO_IHSS_LPS = 11903.13  # techo mensual del IHSS en Honduras (revisar anualmente)
