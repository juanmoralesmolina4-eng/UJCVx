# Setup de Supabase

Pasos exactos para conectar la app a un proyecto nuevo de Supabase.

## 1. Crear proyecto

1. Entra a [supabase.com](https://supabase.com) e inicia sesión.
2. **New Project**.
3. Nombre: `ujcvx` (o el que quieras).
4. Database password: generala con el botón "Generate", guárdala en un gestor.
5. Region: la más cercana a Honduras — **`East US (North Virginia)`** funciona bien.
6. Plan: Free está bien para empezar.
7. **Create new project**. Tarda ~2 minutos en provisionar.

## 2. Correr el schema

1. En el panel izquierdo: **SQL Editor**.
2. **New query**.
3. Abre `web/supabase/schema.sql` y copia TODO su contenido.
4. Pégalo en el editor.
5. Click en **Run** (botón verde abajo a la derecha, o Ctrl+Enter).
6. Deberías ver `Success. No rows returned`.

Si necesitas re-correrlo, no hay problema — el script es idempotente.

## 3. Conectar la app

1. En el panel izquierdo de Supabase: **Settings → API**.
2. Copia el **Project URL** y la **anon public key**.
3. En tu máquina, crea `web/.env.local` (basado en `web/.env.example`):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

4. Si la app está corriendo (`npm run dev`), reiníciala.

## 4. Verificar

Una vez levantada la app, visita `http://localhost:3000`. Si la conexión a Supabase está OK, el estado en la página dirá "Conectado". Si no, dirá "Sin conexión".

## Notas

- El schema activa **Row Level Security** en todas las tablas. La política inicial: cualquier usuario autenticado puede leer y escribir. Más adelante se afina por rol.
- Crea también un bucket de Storage llamado `uploads` para los Excels.
- El `service_role` key no se usa por ahora — está en `.env.example` por si más adelante se requieren operaciones admin desde el servidor.
