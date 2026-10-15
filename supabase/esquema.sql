-- Alas de Ángel · esquema de Supabase.
-- Pegalo entero en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.
-- Después corré semilla.sql para cargar el catálogo inicial y sumá tu mail a `admins` (al final).

-- ---------- Productos ----------

create table if not exists public.productos (
  id               text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tipo             text not null check (tipo in ('fisico', 'descargable', 'pack')),
  cat              text,
  nombre           text not null,
  resumen          text not null default '',
  detalle          text,
  precio           integer not null check (precio >= 0),
  dibujo           text not null default 'cuaderno',
  color            text not null default 'lavanda' check (color in ('lavanda', 'amanecer', 'halo', 'menta')),
  destacado        boolean not null default false,
  contenido        text[],
  fotos            text[],
  descripcion      text[],
  caracteristicas  text[],
  orden            integer not null default 0,
  activo           boolean not null default true,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

create or replace function public.tocar_actualizado_en()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.actualizado_en = now();
  return new;
end $$;

drop trigger if exists productos_actualizado_en on public.productos;
create trigger productos_actualizado_en
  before update on public.productos
  for each row execute function public.tocar_actualizado_en();

-- ---------- Quién puede entrar al panel ----------
-- Solo las cuentas cuyo mail esté en esta tabla pueden editar. Tener usuario no alcanza.

create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- Sin políticas: nadie la lee ni la escribe desde la web. Se edita desde el SQL Editor.

create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;
grant execute on function public.es_admin() to anon, authenticated;

-- ---------- Reglas de acceso (RLS) ----------

alter table public.productos enable row level security;

drop policy if exists "Todos ven los productos activos" on public.productos;
create policy "Todos ven los productos activos" on public.productos
  for select using (activo or public.es_admin());

drop policy if exists "Las admins cargan productos" on public.productos;
create policy "Las admins cargan productos" on public.productos
  for insert to authenticated with check (public.es_admin());

drop policy if exists "Las admins editan productos" on public.productos;
create policy "Las admins editan productos" on public.productos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "Las admins borran productos" on public.productos;
create policy "Las admins borran productos" on public.productos
  for delete to authenticated using (public.es_admin());

-- ---------- Fotos (Storage) ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Las admins suben fotos" on storage.objects;
create policy "Las admins suben fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos' and public.es_admin());

drop policy if exists "Las admins cambian fotos" on storage.objects;
create policy "Las admins cambian fotos" on storage.objects
  for update to authenticated using (bucket_id = 'productos' and public.es_admin());

drop policy if exists "Las admins borran fotos" on storage.objects;
create policy "Las admins borran fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'productos' and public.es_admin());

-- ---------- Tu cuenta ----------
-- 1. Authentication → Users → Add user → con tu mail y una contraseña (tildá "Auto Confirm User").
-- 2. Cambiá el mail de abajo por ese mismo y corré esta línea:
-- insert into public.admins (email) values ('tu-mail@ejemplo.com') on conflict do nothing;
