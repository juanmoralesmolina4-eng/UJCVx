# UJCVx — Sistema de Programación Académica

Plataforma para la gestión de la programación académica y pagos docentes de la Universidad José Cecilio del Valle.

## Estructura

- `proyecto_madrina/` — pipeline en Python que carga el Excel de programación, valida y genera reportes de problemas + un Excel normalizado.
- `web/` — aplicación Next.js 16 (App Router + TypeScript + Tailwind). Frontend de la plataforma.
- `web/supabase/schema.sql` — schema de la base de datos, multi-campus desde el día 1.
- `web/lib/types.ts` — tipos del dominio académico, espejo de `proyecto_madrina/modelo.py`.

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

## App web (Next.js)

Requisitos: Node 20+, npm.

```
cd web
npm install
npm run dev
```

Abre `http://localhost:3000`.

Antes de conectar Supabase, copiar `.env.example` a `.env.local` y completar las claves del proyecto.

## Datos sensibles

Los Excels de programación, los archivos de pago y las transcripciones de audio están listados en `.gitignore` y **nunca** se suben al repositorio.
