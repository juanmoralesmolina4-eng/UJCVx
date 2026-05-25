# UJCVx — Sistema de Programación Académica

Plataforma para la gestión de la programación académica y pagos docentes de la Universidad José Cecilio del Valle.

## Estructura

- `proyecto_madrina/` — pipeline en Python que carga el Excel de programación, valida y genera reportes de problemas + un Excel normalizado.
- `web/` — aplicación Next.js + Supabase + Vercel (próximamente).

## Pipeline Python

Requisitos: Python 3.12, `openpyxl`.

```
cd proyecto_madrina
python main.py
```

Lee el Excel de programación de la raíz del proyecto y genera dos archivos:

- `Reporte_validacion.xlsx` — hallazgos por tipo (solapes de aula, horas inconsistentes, etc.).
- `Programacion_normalizada.xlsx` — los mismos datos normalizados y limpios.

### Tests

```
cd proyecto_madrina
python test_normalizar.py
```

## Datos sensibles

Los Excels de programación, los archivos de pago y las transcripciones de audio están listados en `.gitignore` y **nunca** se suben al repositorio.
