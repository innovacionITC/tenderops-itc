-- Ubicaciones (departamentos y ciudades) como catálogos de Paramétrica.
-- Alinea las tablas existentes con el patrón de los demás catálogos (estado +
-- auditoría), crea las tablas de unión con parametrica_parametros y los índices
-- de búsqueda para que el filtrado de ciudades (~1.100 municipios DANE) sea
-- rápido e insensible a acentos/mayúsculas.
--
-- Idempotente: se puede ejecutar más de una vez sin efectos secundarios.

-- ── Extensiones de búsqueda ─────────────────────────────────────────────────
create extension if not exists pg_trgm with schema public;
create extension if not exists unaccent with schema public;

-- unaccent() no es IMMUTABLE (resuelve el diccionario vía search_path), así que
-- no puede usarse directamente en un índice. Wrapper con diccionario fijo:
create or replace function public.immutable_unaccent(texto text)
returns text
language sql
immutable
parallel safe
strict
as $$ select public.unaccent('public.unaccent'::regdictionary, texto) $$;

-- ── Columnas de estado y auditoría (patrón de catálogos) ────────────────────
alter table public.departamentos
  add column if not exists estado boolean default true,
  add column if not exists creado_por uuid,
  add column if not exists modificado_por uuid,
  add column if not exists fecha_creacion timestamptz not null default now(),
  add column if not exists fecha_modificacion timestamptz not null default now();

alter table public.ciudades
  add column if not exists estado boolean default true,
  add column if not exists creado_por uuid,
  add column if not exists modificado_por uuid,
  add column if not exists fecha_creacion timestamptz not null default now(),
  add column if not exists fecha_modificacion timestamptz not null default now();

do $$ begin
  alter table public.departamentos
    add constraint departamentos_creado_por_fkey foreign key (creado_por) references auth.users(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.departamentos
    add constraint departamentos_modificado_por_fkey foreign key (modificado_por) references auth.users(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.ciudades
    add constraint ciudades_creado_por_fkey foreign key (creado_por) references auth.users(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.ciudades
    add constraint ciudades_modificado_por_fkey foreign key (modificado_por) references auth.users(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ── Tablas de unión con la paramétrica ──────────────────────────────────────
create table if not exists public.departamento_parametros (
  id uuid primary key default gen_random_uuid(),
  parametrica_parametros_id uuid,
  departamento_id uuid,
  constraint departamento_parametros_parametrica_parametros_id_fkey
    foreign key (parametrica_parametros_id) references public.parametrica_parametros(id) on delete cascade,
  constraint departamento_parametros_departamento_id_fkey
    foreign key (departamento_id) references public.departamentos(id) on delete cascade,
  constraint departamento_parametros_pp_id_departamento_id_key
    unique (parametrica_parametros_id, departamento_id)
);

create table if not exists public.ciudad_parametros (
  id uuid primary key default gen_random_uuid(),
  parametrica_parametros_id uuid,
  ciudad_id uuid,
  constraint ciudad_parametros_parametrica_parametros_id_fkey
    foreign key (parametrica_parametros_id) references public.parametrica_parametros(id) on delete cascade,
  constraint ciudad_parametros_ciudad_id_fkey
    foreign key (ciudad_id) references public.ciudades(id) on delete cascade,
  constraint ciudad_parametros_pp_id_ciudad_id_key
    unique (parametrica_parametros_id, ciudad_id)
);

alter table public.departamento_parametros enable row level security;
alter table public.ciudad_parametros enable row level security;

do $$ begin
  create policy "depp read auth" on public.departamento_parametros
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "depp admin all" on public.departamento_parametros
    for all to authenticated
    using (has_role(auth.uid(), 'administrador'::app_role))
    with check (has_role(auth.uid(), 'administrador'::app_role));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "cp read auth" on public.ciudad_parametros
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "cp admin all" on public.ciudad_parametros
    for all to authenticated
    using (has_role(auth.uid(), 'administrador'::app_role))
    with check (has_role(auth.uid(), 'administrador'::app_role));
exception when duplicate_object then null; end $$;

-- ── Índices de búsqueda ─────────────────────────────────────────────────────
-- GIN + trigram sobre el nombre normalizado: soporta LIKE '%…%' sin seq scan y
-- la normalización hace la búsqueda insensible a acentos ("bogota" → "Bogotá").
create index if not exists idx_ciudades_nombre_trgm
  on public.ciudades
  using gin (public.immutable_unaccent(lower(nombre)) gin_trgm_ops);

create index if not exists idx_departamentos_nombre_trgm
  on public.departamentos
  using gin (public.immutable_unaccent(lower(nombre)) gin_trgm_ops);

-- Join ciudades → departamento (listados y borrado en cascada).
create index if not exists idx_ciudades_departamento
  on public.ciudades
  using btree (departamento_id);
