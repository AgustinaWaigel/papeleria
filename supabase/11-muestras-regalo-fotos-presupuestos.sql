-- Alas de Ángel · páginas de muestra, formato de los descargables, regalo al suscribirse, fotos de clientas y
-- pedidos por mayor.
-- Correlo después de 10-precio-por-cantidad.sql (SQL Editor → New query → Run), ANTES de publicar la versión
-- de la tienda que lo usa. Se puede correr más de una vez.

-- ---------- Páginas de muestra ("Mirá por dentro") ----------
-- Fotos de las hojas de adentro (de un descargable o de un cuaderno). Van en el bucket público de fotos.
alter table public.productos add column if not exists muestras text[];
grant select (muestras) on public.productos to anon;

-- ---------- Formato de los descargables (PDF para imprimir o editable en Canva) ----------
-- Cada formato es un producto aparte, con su precio y su PDF (el de Canva lleva adentro el link a la plantilla).
-- otra_version une los dos: en la tienda se elige el formato en la página del producto y el catálogo muestra uno.
alter table public.productos add column if not exists formato text check (formato in ('pdf', 'canva'));
alter table public.productos add column if not exists otra_version text references public.productos (id) on delete set null;
grant select (formato, otra_version) on public.productos to anon;

-- ---------- Regalo al suscribirse ----------
-- El descargable que le llega por mail a quien se anota en las novedades (vacío: no hay regalo).
alter table public.ajustes add column if not exists regalo_producto text references public.productos (id) on delete set null;
-- clave: la parte secreta del link para bajar el regalo (como la de los pedidos). El link no vence.
alter table public.suscriptores add column if not exists clave text not null default replace(gen_random_uuid()::text, '-', '');
alter table public.suscriptores add column if not exists regalo_enviado_en timestamptz;

-- ---------- Fotos de clientas ("Así lo usan") ----------
-- Las carga el panel, con el permiso de quien sacó la foto. producto_id: en qué producto se muestra (vacío: solo
-- en Inicio).
create table if not exists public.fotos_clientas (
  id           bigint generated always as identity primary key,
  foto         text not null,
  autora       text,
  producto_id  text references public.productos (id) on delete set null,
  orden        integer not null default 0,
  creado_en    timestamptz not null default now()
);
alter table public.fotos_clientas enable row level security;
drop policy if exists "Todos ven las fotos de clientas" on public.fotos_clientas;
create policy "Todos ven las fotos de clientas" on public.fotos_clientas for select using (true);
drop policy if exists "Las admins manejan fotos de clientas" on public.fotos_clientas;
create policy "Las admins manejan fotos de clientas" on public.fotos_clientas
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- ---------- Pedidos por mayor (presupuestos) ----------
create table if not exists public.presupuestos (
  id            bigint generated always as identity primary key,
  codigo        text not null unique,
  nombre        text not null,
  email         text not null,
  telefono      text,
  tipo          text not null check (tipo in ('emprendimiento', 'escuela', 'evento', 'otro')),
  organizacion  text,
  detalle       text not null,
  fecha         text,
  estado        text not null default 'nuevo' check (estado in ('nuevo', 'atendido')),
  creado_en     timestamptz not null default now()
);
alter table public.presupuestos enable row level security;
drop policy if exists "Las admins ven presupuestos" on public.presupuestos;
create policy "Las admins ven presupuestos" on public.presupuestos for select to authenticated using (public.es_admin());
drop policy if exists "Las admins atienden presupuestos" on public.presupuestos;
create policy "Las admins atienden presupuestos" on public.presupuestos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "Las admins borran presupuestos" on public.presupuestos;
create policy "Las admins borran presupuestos" on public.presupuestos for delete to authenticated using (public.es_admin());

-- Cualquiera pide presupuesto; recibe un código al instante (como el botón de arrepentimiento).
create or replace function public.crear_presupuesto(
  p_nombre text, p_email text, p_telefono text, p_tipo text, p_organizacion text, p_detalle text, p_fecha text
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_codigo text := 'PR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
begin
  if char_length(trim(p_nombre)) < 2 then raise exception 'falta el nombre'; end if;
  if trim(p_email) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'mail no válido'; end if;
  if char_length(trim(p_detalle)) < 5 then raise exception 'falta el detalle'; end if;
  insert into public.presupuestos (codigo, nombre, email, telefono, tipo, organizacion, detalle, fecha)
  values (v_codigo, left(trim(p_nombre), 80), left(lower(trim(p_email)), 120), nullif(left(trim(p_telefono), 40), ''),
          case when p_tipo in ('emprendimiento', 'escuela', 'evento') then p_tipo else 'otro' end,
          nullif(left(trim(p_organizacion), 120), ''), left(trim(p_detalle), 3000), nullif(left(trim(p_fecha), 60), ''));
  return v_codigo;
end $$;
grant execute on function public.crear_presupuesto(text, text, text, text, text, text, text) to anon, authenticated;
