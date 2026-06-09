-- =====================================================================
--  LA COMPRA DE CASA — Esquema de base de datos para Supabase
--  Pega TODO este archivo en Supabase > SQL Editor y pulsa "Run".
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLAS
-- ---------------------------------------------------------------------

-- Miembros de la familia que pueden entrar (la lista blanca de correos)
create table if not exists public.family_members (
  email      text primary key,
  name       text not null,
  added_at   timestamptz not null default now()
);

-- Productos de la lista actual
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  quantity    text,
  category    text not null default 'Otros',
  done        boolean not null default false,
  added_by    text,
  created_at  timestamptz not null default now()
);

-- Compras ya hechas (cada vez que se "cierra la compra")
create table if not exists public.shopping_history (
  id            uuid primary key default gen_random_uuid(),
  items         jsonb not null,
  completed_by  text,
  completed_at  timestamptz not null default now()
);

-- Fotos de familia (el archivo vive en Storage; aquí guardamos la referencia)
create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  path         text not null,
  caption      text,
  uploaded_by  text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. FUNCIÓN DE COMPROBACIÓN ("¿es de la familia?")
--    SECURITY DEFINER para evitar recursión en las políticas RLS.
-- ---------------------------------------------------------------------
create or replace function public.is_family()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.family_members
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- ---------------------------------------------------------------------
-- 3. SEGURIDAD A NIVEL DE FILA (RLS)
--    Solo la familia puede leer y escribir.
-- ---------------------------------------------------------------------
alter table public.family_members  enable row level security;
alter table public.items           enable row level security;
alter table public.shopping_history enable row level security;
alter table public.photos          enable row level security;

-- family_members: la familia puede ver quién es la familia.
-- (Añadir/editar miembros se hace desde el panel de Supabase.)
drop policy if exists "familia ve familia" on public.family_members;
create policy "familia ve familia"
  on public.family_members for select
  using (public.is_family());

-- items: la familia puede hacer de todo
drop policy if exists "familia gestiona items" on public.items;
create policy "familia gestiona items"
  on public.items for all
  using (public.is_family())
  with check (public.is_family());

-- shopping_history: la familia puede ver y crear
drop policy if exists "familia gestiona historial" on public.shopping_history;
create policy "familia gestiona historial"
  on public.shopping_history for all
  using (public.is_family())
  with check (public.is_family());

-- photos: la familia puede ver, subir y borrar
drop policy if exists "familia gestiona fotos" on public.photos;
create policy "familia gestiona fotos"
  on public.photos for all
  using (public.is_family())
  with check (public.is_family());

-- ---------------------------------------------------------------------
-- 4. SINCRONIZACIÓN EN TIEMPO REAL para la lista
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.items;

-- ---------------------------------------------------------------------
-- 5. ALMACENAMIENTO DE FOTOS (bucket privado)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos-familia', 'fotos-familia', false)
on conflict (id) do nothing;

-- Solo la familia puede ver, subir y borrar fotos
drop policy if exists "familia ve fotos" on storage.objects;
create policy "familia ve fotos"
  on storage.objects for select
  using (bucket_id = 'fotos-familia' and public.is_family());

drop policy if exists "familia sube fotos" on storage.objects;
create policy "familia sube fotos"
  on storage.objects for insert
  with check (bucket_id = 'fotos-familia' and public.is_family());

drop policy if exists "familia borra fotos" on storage.objects;
create policy "familia borra fotos"
  on storage.objects for delete
  using (bucket_id = 'fotos-familia' and public.is_family());

-- ---------------------------------------------------------------------
-- 6. LA FAMILIA  ← EDITA ESTOS CORREOS antes de ejecutar
--    Pon el correo real (en minúsculas) con el que entrará cada uno.
--    Puedes añadir o quitar miembros más adelante desde
--    Supabase > Table Editor > family_members.
-- ---------------------------------------------------------------------
insert into public.family_members (email, name) values
  ('alberto@ejemplo.com',  'Alberto'),
  ('beatriz@ejemplo.com',  'Beatriz'),
  ('jaime@ejemplo.com',    'Jaime'),
  ('juan@ejemplo.com',     'Juan'),
  ('itziar@ejemplo.com',   'Itziar'),
  ('inigo@ejemplo.com',    'Íñigo')
on conflict (email) do nothing;
