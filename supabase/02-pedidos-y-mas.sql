-- Alas de Ángel · pedidos, ventas, stock, ofertas, categorías, reseñas y suscriptores.
-- Correlo después de esquema.sql (SQL Editor → New query → Run). Se puede correr más de una vez.

-- ---------- Stock y ofertas en productos ----------
-- stock vacío (null) = no se controla: siempre se puede pedir.
-- precio_anterior: si está y es mayor que el precio, el producto se muestra en oferta.

alter table public.productos add column if not exists stock integer check (stock is null or stock >= 0);
alter table public.productos add column if not exists precio_anterior integer check (precio_anterior is null or precio_anterior >= 0);

-- ---------- Categorías ----------

create table if not exists public.categorias (
  id      text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tipo    text not null check (tipo in ('fisico', 'descargable')),
  nombre  text not null,
  orden   integer not null default 0
);

insert into public.categorias (id, tipo, nombre, orden) values
  ('cuadernos', 'fisico', 'Cuadernos y libretas', 10),
  ('agendas', 'fisico', 'Agendas y planners', 20),
  ('stickers', 'fisico', 'Stickers y washi', 30),
  ('escritura', 'fisico', 'Para escribir', 40),
  ('tarjetas', 'fisico', 'Tarjetas y notas', 50),
  ('planners', 'descargable', 'Planners', 10),
  ('estudio', 'descargable', 'Estudio', 20),
  ('hogar', 'descargable', 'Casa y finanzas', 30),
  ('festejos', 'descargable', 'Festejos', 40)
on conflict (id) do nothing;

alter table public.categorias enable row level security;
drop policy if exists "Todos ven las categorías" on public.categorias;
create policy "Todos ven las categorías" on public.categorias for select using (true);
drop policy if exists "Las admins manejan categorías" on public.categorias;
create policy "Las admins manejan categorías" on public.categorias
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- ---------- Pedidos y ventas ----------
-- Un pedido puede venir de la web (la bolsita) o cargarse a mano desde el panel (una venta en
-- persona, por Instagram, en una feria…). El stock se descuenta cuando el pedido queda
-- confirmado (pagado, enviado o entregado) y se devuelve si se cancela o se borra.

create table if not exists public.pedidos (
  id                bigint generated always as identity primary key,
  codigo            text not null unique,
  origen            text not null default 'web' check (origen in ('web', 'manual')),
  estado            text not null default 'nuevo' check (estado in ('nuevo', 'pagado', 'enviado', 'entregado', 'cancelado')),
  cliente_nombre    text,
  cliente_contacto  text,
  medio_pago        text,
  notas             text,
  total             integer not null default 0,
  fecha             date not null default (now() at time zone 'America/Argentina/Buenos_Aires')::date,
  stock_descontado  boolean not null default false,
  creado_en         timestamptz not null default now()
);
create index if not exists pedidos_fecha on public.pedidos (fecha desc);
-- Si la tabla ya existía de una corrida anterior, que la fecha por defecto sea la de Argentina.
alter table public.pedidos alter column fecha set default (now() at time zone 'America/Argentina/Buenos_Aires')::date;

create table if not exists public.pedido_items (
  id               bigint generated always as identity primary key,
  pedido_id        bigint not null references public.pedidos (id) on delete cascade,
  producto_id      text references public.productos (id) on delete set null,
  nombre           text not null,
  precio_unitario  integer not null check (precio_unitario >= 0),
  cantidad         integer not null check (cantidad > 0)
);
create index if not exists pedido_items_pedido on public.pedido_items (pedido_id);

alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
drop policy if exists "Las admins ven pedidos" on public.pedidos;
create policy "Las admins ven pedidos" on public.pedidos for select to authenticated using (public.es_admin());
drop policy if exists "Las admins editan pedidos" on public.pedidos;
create policy "Las admins editan pedidos" on public.pedidos for update to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "Las admins ven items" on public.pedido_items;
create policy "Las admins ven items" on public.pedido_items for select to authenticated using (public.es_admin());
-- Altas, cambios de estado y bajas pasan por las funciones de abajo, que cuidan el stock.

-- Suma (signo 1) o resta (signo -1) del stock lo que lleva un pedido.
create or replace function public.mover_stock(p_pedido bigint, p_signo integer)
returns void language sql security definer set search_path = '' as $$
  update public.productos p
     set stock = greatest(0, p.stock + p_signo * i.cantidad)
    from (select producto_id, sum(cantidad)::int as cantidad
            from public.pedido_items where pedido_id = p_pedido group by producto_id) i
   where p.id = i.producto_id and p.stock is not null;
$$;
revoke execute on function public.mover_stock(bigint, integer) from public, anon, authenticated;

-- Deja el stock de acuerdo con el estado del pedido.
create or replace function public.acomodar_stock(p_pedido bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_estado text;
  v_descontado boolean;
  v_confirmado boolean;
begin
  select estado, stock_descontado into v_estado, v_descontado from public.pedidos where id = p_pedido for update;
  v_confirmado := v_estado in ('pagado', 'enviado', 'entregado');
  if v_confirmado and not v_descontado then
    perform public.mover_stock(p_pedido, -1);
    update public.pedidos set stock_descontado = true where id = p_pedido;
  elsif not v_confirmado and v_descontado then
    perform public.mover_stock(p_pedido, 1);
    update public.pedidos set stock_descontado = false where id = p_pedido;
  end if;
end $$;
revoke execute on function public.acomodar_stock(bigint) from public, anon, authenticated;

-- Pedido desde la web. Los precios se toman de la base, no de lo que mande el navegador.
-- p_items: [{"id": "cuaderno-pluma", "cantidad": 2}, …]
create or replace function public.crear_pedido_web(p_codigo text, p_items jsonb, p_nombre text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_pedido bigint;
begin
  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'pedido vacío o demasiado grande';
  end if;

  insert into public.pedidos (codigo, origen, cliente_nombre)
  values (left(p_codigo, 20), 'web', nullif(left(trim(p_nombre), 80), ''))
  returning id into v_pedido;

  insert into public.pedido_items (pedido_id, producto_id, nombre, precio_unitario, cantidad)
  select v_pedido, p.id, p.nombre, p.precio, least(greatest((x ->> 'cantidad')::int, 1), 99)
    from jsonb_array_elements(p_items) x
    join public.productos p on p.id = x ->> 'id' and p.activo;

  update public.pedidos set total = coalesce((select sum(precio_unitario * cantidad) from public.pedido_items where pedido_id = v_pedido), 0)
   where id = v_pedido;
  return v_pedido;
end $$;
grant execute on function public.crear_pedido_web(text, jsonb, text) to anon, authenticated;

-- Venta cargada a mano desde el panel. Acá los precios sí los pone quien carga (puede haber
-- hecho un descuento). p_items: [{"id": "cuaderno-pluma" | null, "nombre": "…", "precio": 9800, "cantidad": 1}, …]
create or replace function public.registrar_venta(
  p_codigo text, p_items jsonb, p_estado text, p_fecha date,
  p_nombre text, p_contacto text, p_medio_pago text, p_notas text
) returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_pedido bigint;
begin
  if not public.es_admin() then raise exception 'sin permiso'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'la venta no tiene productos'; end if;

  insert into public.pedidos (codigo, origen, estado, fecha, cliente_nombre, cliente_contacto, medio_pago, notas)
  values (p_codigo, 'manual', p_estado, coalesce(p_fecha, (now() at time zone 'America/Argentina/Buenos_Aires')::date),
          nullif(trim(p_nombre), ''), nullif(trim(p_contacto), ''), nullif(trim(p_medio_pago), ''), nullif(trim(p_notas), ''))
  returning id into v_pedido;

  insert into public.pedido_items (pedido_id, producto_id, nombre, precio_unitario, cantidad)
  select v_pedido, p.id, coalesce(nullif(trim(x ->> 'nombre'), ''), p.nombre),
         greatest((x ->> 'precio')::int, 0), greatest((x ->> 'cantidad')::int, 1)
    from jsonb_array_elements(p_items) x
    left join public.productos p on p.id = x ->> 'id';

  update public.pedidos set total = (select sum(precio_unitario * cantidad) from public.pedido_items where pedido_id = v_pedido)
   where id = v_pedido;
  perform public.acomodar_stock(v_pedido);
  return v_pedido;
end $$;
grant execute on function public.registrar_venta(text, jsonb, text, date, text, text, text, text) to authenticated;

create or replace function public.cambiar_estado_pedido(p_pedido bigint, p_estado text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'sin permiso'; end if;
  update public.pedidos set estado = p_estado where id = p_pedido;
  perform public.acomodar_stock(p_pedido);
end $$;
grant execute on function public.cambiar_estado_pedido(bigint, text) to authenticated;

create or replace function public.borrar_pedido(p_pedido bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'sin permiso'; end if;
  update public.pedidos set estado = 'cancelado' where id = p_pedido;
  perform public.acomodar_stock(p_pedido); -- devuelve el stock si lo había descontado
  delete from public.pedidos where id = p_pedido;
end $$;
grant execute on function public.borrar_pedido(bigint) to authenticated;

-- ---------- Reseñas ----------
-- Cualquiera puede dejar una; se publica cuando la aprobás desde el panel.

create table if not exists public.resenas (
  id           bigint generated always as identity primary key,
  producto_id  text not null references public.productos (id) on delete cascade,
  nombre       text not null check (char_length(nombre) between 1 and 60),
  texto        text not null check (char_length(texto) between 3 and 1000),
  puntaje      integer not null check (puntaje between 1 and 5),
  aprobada     boolean not null default false,
  creado_en    timestamptz not null default now()
);
create index if not exists resenas_producto on public.resenas (producto_id) where aprobada;

alter table public.resenas enable row level security;
drop policy if exists "Todos ven las reseñas aprobadas" on public.resenas;
create policy "Todos ven las reseñas aprobadas" on public.resenas for select using (aprobada or public.es_admin());
drop policy if exists "Cualquiera deja una reseña" on public.resenas;
create policy "Cualquiera deja una reseña" on public.resenas for insert to anon, authenticated with check (not aprobada);
drop policy if exists "Las admins moderan reseñas" on public.resenas;
create policy "Las admins moderan reseñas" on public.resenas for update to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "Las admins borran reseñas" on public.resenas;
create policy "Las admins borran reseñas" on public.resenas for delete to authenticated using (public.es_admin());

-- ---------- Suscriptores ----------

create table if not exists public.suscriptores (
  email      text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  creado_en  timestamptz not null default now()
);
alter table public.suscriptores enable row level security;
drop policy if exists "Cualquiera se suscribe" on public.suscriptores;
create policy "Cualquiera se suscribe" on public.suscriptores for insert to anon, authenticated with check (true);
drop policy if exists "Las admins ven suscriptores" on public.suscriptores;
create policy "Las admins ven suscriptores" on public.suscriptores for select to authenticated using (public.es_admin());
drop policy if exists "Las admins borran suscriptores" on public.suscriptores;
create policy "Las admins borran suscriptores" on public.suscriptores for delete to authenticated using (public.es_admin());
