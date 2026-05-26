-- ============================================================================
-- UJCVx — Schema inicial para Supabase
--
-- CÓMO USAR:
--   1. Crea un proyecto nuevo en https://supabase.com
--   2. Ve a SQL Editor (ícono de base de datos a la izquierda)
--   3. Pega TODO este archivo en una nueva query
--   4. Run (botón verde abajo a la derecha)
--   5. Al terminar: Settings → API → copia el Project URL y la `anon` key
--      a tu `web/.env.local` (ver web/.env.example)
--
-- Es idempotente: puedes correrlo varias veces sin problemas.
-- ============================================================================

-- Extensiones (Supabase ya tiene pgcrypto activado, uuid-ossp lo agregamos)
create extension if not exists "uuid-ossp";


-- ============================================================================
-- CATÁLOGOS — datos que cambian poco
-- ============================================================================

create table if not exists campuses (
  codigo        text primary key,
  nombre        text not null,
  ciudad        text not null,
  created_at    timestamptz default now()
);

insert into campuses (codigo, nombre, ciudad) values
  ('T', 'Campus Tegucigalpa', 'Tegucigalpa'),
  ('C', 'Campus Comayagua',   'Comayagua')
on conflict do nothing;


create table if not exists periodos (
  id            uuid primary key default uuid_generate_v4(),
  codigo        text not null unique,
  anio          int  not null,
  numero        int  not null check (numero in (1, 2, 3)),
  fecha_inicio  date,
  fecha_fin     date,
  semanas       int  not null default 16,
  created_at    timestamptz default now()
);


create table if not exists carreras (
  id            uuid primary key default uuid_generate_v4(),
  codigo        text not null unique,
  nombre        text not null,
  facultad      text,
  created_at    timestamptz default now()
);


create table if not exists aulas (
  id                uuid primary key default uuid_generate_v4(),
  campus_codigo     text not null references campuses(codigo),
  codigo            text not null,
  nombre            text,
  capacidad         int,
  tipo              text,
  ubicacion         text,
  created_at        timestamptz default now(),
  unique (campus_codigo, codigo)
);


create table if not exists catedraticos (
  id                  uuid primary key default uuid_generate_v4(),
  nombre              text not null,
  nombre_normalizado  text not null unique,
  identidad           text unique,
  tipo_contrato       text,
  tarifa_por_hora     numeric(10, 2),
  es_planta           boolean default false,
  activo              boolean default true,
  created_at          timestamptz default now()
);


create table if not exists asignaturas (
  id            uuid primary key default uuid_generate_v4(),
  codigo        text not null unique,
  nombre        text not null,
  carrera_id    uuid references carreras(id),
  horas_pensum  int,
  created_at    timestamptz default now()
);


-- ============================================================================
-- IMPORTACIONES — cada carga de Excel queda registrada
-- ============================================================================

create table if not exists importaciones (
  id            uuid primary key default uuid_generate_v4(),
  tipo          text not null check (tipo in ('programacion', 'rrhh')),
  archivo       text not null,
  campus_codigo text references campuses(codigo),
  periodo_id    uuid references periodos(id),
  subido_por    uuid references auth.users(id),
  total_filas   int,
  status        text not null default 'pendiente' check (status in ('pendiente', 'procesando', 'completada', 'fallida')),
  error         text,
  created_at    timestamptz default now(),
  procesada_at  timestamptz
);


-- ============================================================================
-- PROGRAMACIÓN — secciones de clase
-- ============================================================================

create table if not exists clases (
  id                  uuid primary key default uuid_generate_v4(),
  periodo_id          uuid not null references periodos(id),
  campus_codigo       text not null references campuses(codigo),
  importacion_id      uuid references importaciones(id),

  hoja_origen         text,
  fila_origen         int,

  catedratico_id      uuid references catedraticos(id),
  catedratico_nombre  text not null,
  catedratico_es_nuevo boolean default false,

  asignatura_id       uuid references asignaturas(id),
  codigo              text not null,
  codigos_alternos    text[],
  asignatura_nombre   text not null,
  carrera_codigo      text,

  alumnos             int,
  modalidad           text check (modalidad in ('PRESENCIAL', 'VIRTUAL', 'SEMIPRESENCIAL', 'SEMI-PRESENCIAL')),
  aula_id             uuid references aulas(id),
  aula_texto          text,
  seccion             text not null,

  horas_presenciales  numeric(5, 2),
  horas_asincronicas  numeric(5, 2),
  horas_totales       numeric(5, 2),

  observaciones       text,
  created_at          timestamptz default now()
);

create index if not exists idx_clases_periodo_campus on clases(periodo_id, campus_codigo);
create index if not exists idx_clases_catedratico   on clases(catedratico_id);
create index if not exists idx_clases_codigo        on clases(codigo);


create table if not exists bloques_horarios (
  id            uuid primary key default uuid_generate_v4(),
  clase_id      uuid not null references clases(id) on delete cascade,
  dia           text not null check (dia in ('LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM')),
  inicio_min    int  not null check (inicio_min between 0 and 1439),
  fin_min       int  not null check (fin_min between 0 and 1439),
  constraint bloque_valido check (fin_min > inicio_min)
);

create index if not exists idx_bloques_clase on bloques_horarios(clase_id);
create index if not exists idx_bloques_dia   on bloques_horarios(dia, inicio_min);


-- ============================================================================
-- VALIDACIÓN — corridas y problemas detectados
-- ============================================================================

create table if not exists corridas_validacion (
  id              uuid primary key default uuid_generate_v4(),
  periodo_id      uuid not null references periodos(id),
  campus_codigo   text references campuses(codigo),
  total_clases    int,
  total_problemas int,
  resumen         jsonb,
  ejecutada_por   uuid references auth.users(id),
  created_at      timestamptz default now()
);


create table if not exists problemas (
  id                uuid primary key default uuid_generate_v4(),
  corrida_id        uuid not null references corridas_validacion(id) on delete cascade,
  tipo              text not null,
  severidad         text not null check (severidad in ('alta', 'media', 'baja')),
  descripcion       text not null,
  referencias       jsonb,
  extra             jsonb,
  resuelto          boolean default false,
  resuelto_at       timestamptz,
  resuelto_por      uuid references auth.users(id),
  nota_resolucion   text,
  created_at        timestamptz default now()
);

create index if not exists idx_problemas_corrida      on problemas(corrida_id);
create index if not exists idx_problemas_no_resueltos on problemas(corrida_id) where not resuelto;


-- ============================================================================
-- PAGOS — derivado de la programación, alimenta a RRHH
-- ============================================================================

create table if not exists corridas_pago (
  id            uuid primary key default uuid_generate_v4(),
  periodo_id    uuid not null references periodos(id),
  campus_codigo text not null references campuses(codigo),
  numero_pago   int  not null check (numero_pago in (1, 2, 3, 4)),
  semanas       int  not null,
  status        text not null default 'borrador' check (status in ('borrador', 'enviado', 'pagado')),
  created_at    timestamptz default now(),
  enviado_at    timestamptz,
  unique (periodo_id, campus_codigo, numero_pago)
);


create table if not exists pagos_clase (
  id                  uuid primary key default uuid_generate_v4(),
  corrida_pago_id     uuid not null references corridas_pago(id) on delete cascade,
  clase_id            uuid not null references clases(id),

  horas_por_semana    numeric(5, 2) not null,
  semanas_a_pagar     int not null,
  horas_totales       numeric(5, 2) not null,
  valor_por_hora      numeric(10, 2) not null,
  valor_por_clase     numeric(12, 2) generated always as (horas_totales * valor_por_hora) stored
);


create table if not exists pagos_catedratico (
  id                  uuid primary key default uuid_generate_v4(),
  corrida_pago_id     uuid not null references corridas_pago(id) on delete cascade,
  catedratico_id      uuid not null references catedraticos(id),
  total_ingresos      numeric(12, 2) not null default 0,
  deduccion_ihss      numeric(12, 2) default 0,
  deduccion_ujcv      numeric(12, 2) default 0,
  embargo             numeric(12, 2) default 0,
  ach                 numeric(12, 2) default 0,
  total_deducciones   numeric(12, 2) generated always as (
    coalesce(deduccion_ihss, 0) + coalesce(deduccion_ujcv, 0)
    + coalesce(embargo, 0) + coalesce(ach, 0)
  ) stored,
  total_a_pagar       numeric(12, 2) generated always as (
    total_ingresos
    - coalesce(deduccion_ihss, 0) - coalesce(deduccion_ujcv, 0)
    - coalesce(embargo, 0) - coalesce(ach, 0)
  ) stored,
  unique (corrida_pago_id, catedratico_id)
);


-- ============================================================================
-- ROW LEVEL SECURITY
-- Supabase obliga RLS. Política inicial: cualquier usuario autenticado
-- puede leer y escribir todo. Más adelante se afina por rol.
-- ============================================================================

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'campuses', 'periodos', 'carreras', 'aulas', 'catedraticos', 'asignaturas',
      'importaciones', 'clases', 'bloques_horarios',
      'corridas_validacion', 'problemas',
      'corridas_pago', 'pagos_clase', 'pagos_catedratico'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'drop policy if exists "auth_read_%s" on %I',
      t, t
    );
    execute format(
      'create policy "auth_read_%s" on %I for select using (auth.role() = ''authenticated'')',
      t, t
    );
    execute format(
      'drop policy if exists "auth_write_%s" on %I',
      t, t
    );
    execute format(
      'create policy "auth_write_%s" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      t, t
    );
  end loop;
end $$;


-- ============================================================================
-- STORAGE — bucket para los Excel originales subidos
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

-- Política: solo usuarios autenticados pueden subir/leer
drop policy if exists "auth_upload" on storage.objects;
create policy "auth_upload"
  on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');

drop policy if exists "auth_read_uploads" on storage.objects;
create policy "auth_read_uploads"
  on storage.objects for select
  using (bucket_id = 'uploads' and auth.role() = 'authenticated');
