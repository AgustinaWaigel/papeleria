-- Alas de Ángel · costo de envío, cupones, botón de arrepentimiento, avisos de stock, mails automáticos
-- y cotización con Correo Argentino.
-- Correlo después de 05-mail-descargables.sql (SQL Editor → New query → Run), ANTES de publicar la versión
-- de la tienda que lo usa. Se puede correr más de una vez.

-- ---------- Pedidos: envío, cupón y mails ----------
-- total = productos − descuento + costo_envio. Los pedidos de antes quedan con descuento y envío en 0.
alter table public.pedidos add column if not exists costo_envio integer not null default 0 check (costo_envio >= 0);
alter table public.pedidos add column if not exists cupon text;
alter table public.pedidos add column if not exists descuento integer not null default 0 check (descuento >= 0);
-- Cuándo salió cada mail (vacío: todavía no). Así ninguno se manda dos veces sin querer.
alter table public.pedidos add column if not exists mail_confirmacion_en timestamptz;
alter table public.pedidos add column if not exists mail_envio_en timestamptz;
alter table public.pedidos add column if not exists mail_tienda_en timestamptz;

-- ---------- Ajustes de la tienda (una sola fila) ----------
-- envio_costo: el costo por defecto (para zonas sin precio). Vacío: el envío se coordina por WhatsApp.
create table if not exists public.ajustes (
  id                  boolean primary key default true check (id),
  envio_costo         integer check (envio_costo is null or envio_costo >= 0),
  envio_gratis_desde  integer check (envio_gratis_desde is null or envio_gratis_desde > 0),
  envio_detalle       text
);
insert into public.ajustes (id) values (true) on conflict do nothing;

alter table public.ajustes enable row level security;
drop policy if exists "Todos ven los ajustes" on public.ajustes;
create policy "Todos ven los ajustes" on public.ajustes for select using (true);
drop policy if exists "Las admins cambian los ajustes" on public.ajustes;
create policy "Las admins cambian los ajustes" on public.ajustes
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- ---------- Zonas de envío (por código postal y provincia) ----------
-- provincias: la letra del código postal nuevo (E = Entre Ríos, S = Santa Fe…, ver lib/zonas.ts).
-- codigos_postales: los 4 números, para una zona puntual (por ejemplo, Crespo: 3116). Ganan sobre la provincia
-- y, si tienen precio, también sobre la cotización de Correo Argentino.
-- costo vacío: se usa el costo por defecto de ajustes (y si tampoco hay, se coordina aparte).
create table if not exists public.zonas_envio (
  id                bigint generated always as identity primary key,
  nombre            text not null,
  provincias        text[] not null default '{}',
  codigos_postales  text[] not null default '{}',
  costo             integer check (costo is null or costo >= 0),
  orden             integer not null default 0
);
alter table public.zonas_envio enable row level security;
drop policy if exists "Todos ven las zonas de envío" on public.zonas_envio;
create policy "Todos ven las zonas de envío" on public.zonas_envio for select using (true);
drop policy if exists "Las admins manejan las zonas de envío" on public.zonas_envio;
create policy "Las admins manejan las zonas de envío" on public.zonas_envio
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Zonas para arrancar, despachando desde Crespo: Crespo con precio fijo (lo llevás vos); las demás, sin
-- precio, se cargan en el panel → Envíos. Solo si la tabla está vacía.
insert into public.zonas_envio (nombre, provincias, codigos_postales, costo, orden)
select * from (values
  ('Crespo', '{}'::text[], '{3116}'::text[], 3000, 5),
  ('Paraná', '{}'::text[], '{3100}'::text[], null::integer, 10),
  ('Resto de Entre Ríos', '{E}'::text[], '{}'::text[], null::integer, 20),
  ('Litoral (Santa Fe, Corrientes, Misiones, Chaco y Formosa)', '{S,W,N,H,P}'::text[], '{}'::text[], null::integer, 30),
  ('CABA, Buenos Aires y Córdoba', '{C,B,X}'::text[], '{}'::text[], null::integer, 40),
  ('Resto del país', '{A,D,F,G,J,K,L,M,Q,R,T,U,V,Y,Z}'::text[], '{}'::text[], null::integer, 50)
) as z
where not exists (select 1 from public.zonas_envio);

alter table public.pedidos add column if not exists codigo_postal text;
alter table public.pedidos add column if not exists provincia text;

-- Cuánto sale el envío a un destino (null: se coordina aparte). La misma regla que lib/zonas.ts.
create or replace function public.costo_envio(p_provincia text, p_codigo_postal text, p_subtotal integer)
returns integer language plpgsql stable security definer set search_path = '' as $$
declare
  v_numero text := substring(regexp_replace(upper(coalesce(p_codigo_postal, '')), '^[A-Z]', '') from '\d{4}');
  v_zona public.zonas_envio;
  v_ajustes public.ajustes;
  v_costo integer;
begin
  select * into v_ajustes from public.ajustes limit 1;
  select * into v_zona from public.zonas_envio where v_numero is not null and v_numero = any(codigos_postales) order by orden limit 1;
  if not found then
    select * into v_zona from public.zonas_envio where p_provincia = any(provincias) order by orden limit 1;
  end if;
  v_costo := coalesce(v_zona.costo, v_ajustes.envio_costo);
  if v_costo is null then return null; end if;
  if v_ajustes.envio_gratis_desde is not null and p_subtotal >= v_ajustes.envio_gratis_desde then return 0; end if;
  return v_costo;
end $$;
revoke execute on function public.costo_envio(text, text, integer) from public, anon, authenticated;

-- ---------- Cupones ----------
-- Nadie de afuera puede listarlos: solo se valida uno por su código.
create table if not exists public.cupones (
  codigo     text primary key check (codigo ~ '^[A-Z0-9-]{3,30}$'),
  tipo       text not null check (tipo in ('porcentaje', 'monto')),
  valor      integer not null check (valor > 0),
  minimo     integer not null default 0 check (minimo >= 0),
  vence      date,
  usos_max   integer check (usos_max is null or usos_max > 0),
  usos       integer not null default 0,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now(),
  check (tipo <> 'porcentaje' or valor <= 100)
);
alter table public.cupones enable row level security;
drop policy if exists "Las admins manejan cupones" on public.cupones;
create policy "Las admins manejan cupones" on public.cupones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Cuánto descuenta un cupón sobre un subtotal, o por qué no sirve.
create or replace function public.descuento_cupon(p_codigo text, p_subtotal integer)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  c public.cupones;
begin
  select * into c from public.cupones where codigo = upper(trim(p_codigo));
  if not found or not c.activo then return jsonb_build_object('error', 'Ese cupón no existe.'); end if;
  if c.vence is not null and c.vence < (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    return jsonb_build_object('error', 'Ese cupón ya venció.');
  end if;
  if c.usos_max is not null and c.usos >= c.usos_max then
    return jsonb_build_object('error', 'Ese cupón ya se usó todas las veces que se podía.');
  end if;
  if p_subtotal < c.minimo then
    return jsonb_build_object('error', 'Este cupón es para compras desde $ ' || replace(to_char(c.minimo, 'FM999,999,999'), ',', '.') || '.');
  end if;
  return jsonb_build_object(
    'codigo', c.codigo,
    'descuento', least(p_subtotal, case when c.tipo = 'porcentaje' then round(p_subtotal * c.valor / 100.0)::int else c.valor end),
    'texto', case when c.tipo = 'porcentaje' then c.valor || '% off' else '$ ' || replace(to_char(c.valor, 'FM999,999,999'), ',', '.') || ' off' end);
end $$;
revoke execute on function public.descuento_cupon(text, integer) from public, anon, authenticated;

-- Desde la bolsita: ¿sirve este cupón para lo que llevo? (los precios salen de la base).
create or replace function public.validar_cupon(p_codigo text, p_items jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_subtotal integer;
begin
  select coalesce(sum(p.precio * least(greatest((x ->> 'cantidad')::int, 1), 99)), 0) into v_subtotal
    from jsonb_array_elements(p_items) x
    join public.productos p on p.id = x ->> 'id' and p.activo;
  return public.descuento_cupon(p_codigo, v_subtotal);
end $$;
grant execute on function public.validar_cupon(text, jsonb) to anon, authenticated;

-- ---------- Pedido online, con envío por zona y cupón ----------
drop function if exists public.crear_pedido_online(text, jsonb, text, text, text, text, text);
drop function if exists public.crear_pedido_online(text, jsonb, text, text, text, text, text, text);
create or replace function public.crear_pedido_online(
  p_codigo text, p_items jsonb, p_nombre text, p_email text, p_telefono text, p_entrega text, p_direccion text,
  p_cupon text default null, p_codigo_postal text default null, p_provincia text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pedido bigint;
  v_falta text;
  v_subtotal integer;
  v_descuento integer := 0;
  v_cupon text;
  v_cupon_info jsonb;
  v_envio integer := 0;
  v_resultado jsonb;
begin
  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'pedido vacío o demasiado grande';
  end if;
  if p_entrega not in ('retiro', 'envio', 'digital') then raise exception 'entrega no válida'; end if;

  select p.nombre into v_falta
    from jsonb_array_elements(p_items) x
    join public.productos p on p.id = x ->> 'id' and p.activo
   where p.stock is not null and p.stock < least(greatest((x ->> 'cantidad')::int, 1), 99)
   limit 1;
  if v_falta is not null then raise exception 'sin stock: %', v_falta; end if;

  insert into public.pedidos (codigo, origen, cliente_nombre, cliente_email, cliente_telefono, cliente_contacto,
                              entrega, direccion, medio_pago, pago_estado)
  values (left(p_codigo, 20), 'web', nullif(left(trim(p_nombre), 80), ''), nullif(left(lower(trim(p_email)), 120), ''),
          nullif(left(trim(p_telefono), 40), ''), nullif(left(trim(p_telefono), 40), ''),
          p_entrega, nullif(left(trim(p_direccion), 300), ''), 'Mercado Pago', 'pendiente')
  returning id into v_pedido;

  insert into public.pedido_items (pedido_id, producto_id, nombre, precio_unitario, cantidad)
  select v_pedido, p.id, p.nombre, p.precio, least(greatest((x ->> 'cantidad')::int, 1), 99)
    from jsonb_array_elements(p_items) x
    join public.productos p on p.id = x ->> 'id' and p.activo;

  select coalesce(sum(precio_unitario * cantidad), 0) into v_subtotal from public.pedido_items where pedido_id = v_pedido;

  if nullif(trim(p_cupon), '') is not null then
    v_cupon_info := public.descuento_cupon(p_cupon, v_subtotal);
    if v_cupon_info ? 'error' then raise exception 'cupón: %', v_cupon_info ->> 'error'; end if;
    v_cupon := v_cupon_info ->> 'codigo';
    v_descuento := (v_cupon_info ->> 'descuento')::int;
  end if;

  -- Envío según la zona del código postal (sin precio: 0 y se coordina aparte).
  if p_entrega = 'envio' then
    v_envio := coalesce(public.costo_envio(p_provincia, p_codigo_postal, v_subtotal - v_descuento), 0);
  end if;

  update public.pedidos
     set cupon = v_cupon, descuento = v_descuento, costo_envio = v_envio, total = v_subtotal - v_descuento + v_envio,
         codigo_postal = nullif(left(upper(trim(p_codigo_postal)), 10), ''), provincia = nullif(left(p_provincia, 1), '')
   where id = v_pedido;

  select jsonb_build_object(
           'codigo', pe.codigo, 'clave', pe.clave, 'total', pe.total, 'subtotal', v_subtotal,
           'descuento', pe.descuento, 'cupon', pe.cupon, 'costo_envio', pe.costo_envio,
           'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.producto_id, 'nombre', i.nombre,
                                                                  'precio', i.precio_unitario, 'cantidad', i.cantidad))
                                from public.pedido_items i where i.pedido_id = pe.id), '[]'::jsonb))
    into v_resultado
    from public.pedidos pe where pe.id = v_pedido;
  return v_resultado;
end $$;
grant execute on function public.crear_pedido_online(text, jsonb, text, text, text, text, text, text, text, text) to anon, authenticated;

-- El seguimiento ahora muestra también envío y descuento.
create or replace function public.ver_pedido(p_codigo text, p_clave text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
           'codigo', p.codigo, 'estado', p.estado, 'fecha', p.fecha, 'total', p.total,
           'cliente_nombre', p.cliente_nombre, 'entrega', p.entrega, 'direccion', p.direccion,
           'seguimiento', p.seguimiento, 'medio_pago', p.medio_pago, 'pago_estado', p.pago_estado,
           'costo_envio', p.costo_envio, 'descuento', p.descuento, 'cupon', p.cupon,
           'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.producto_id, 'nombre', i.nombre,
                                                                  'precio', i.precio_unitario, 'cantidad', i.cantidad) order by i.id)
                                from public.pedido_items i where i.pedido_id = p.id), '[]'::jsonb))
    from public.pedidos p
   where p.codigo = p_codigo and p.clave = p_clave;
$$;
grant execute on function public.ver_pedido(text, text) to anon, authenticated;

-- Pago aprobado: además de lo de antes, cuenta un uso del cupón.
create or replace function public.registrar_pago_mp(p_codigo text, p_pago_id text, p_estado text, p_monto numeric)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_pedido public.pedidos;
begin
  select * into v_pedido from public.pedidos where codigo = p_codigo for update;
  if not found then return; end if;
  if v_pedido.pago_estado = 'approved' and p_estado in ('pending', 'in_process', 'rejected', 'cancelled') then return; end if;

  update public.pedidos set pago_estado = p_estado, mp_pago_id = p_pago_id where id = v_pedido.id;
  if p_estado = 'approved' and p_monto >= v_pedido.total and v_pedido.estado = 'nuevo' then
    update public.pedidos set estado = 'pagado' where id = v_pedido.id;
    perform public.acomodar_stock(v_pedido.id);
    if v_pedido.cupon is not null then
      update public.cupones set usos = usos + 1 where codigo = v_pedido.cupon;
    end if;
  end if;
end $$;
revoke execute on function public.registrar_pago_mp(text, text, text, numeric) from public, anon, authenticated;
grant execute on function public.registrar_pago_mp(text, text, text, numeric) to service_role;

-- ---------- Botón de arrepentimiento (Res. 424/2020) ----------
create table if not exists public.arrepentimientos (
  id         bigint generated always as identity primary key,
  codigo     text not null unique,
  nombre     text not null,
  email      text not null,
  telefono   text,
  pedido     text,
  motivo     text,
  estado     text not null default 'nuevo' check (estado in ('nuevo', 'atendido')),
  creado_en  timestamptz not null default now()
);
alter table public.arrepentimientos enable row level security;
drop policy if exists "Las admins ven arrepentimientos" on public.arrepentimientos;
create policy "Las admins ven arrepentimientos" on public.arrepentimientos for select to authenticated using (public.es_admin());
drop policy if exists "Las admins atienden arrepentimientos" on public.arrepentimientos;
create policy "Las admins atienden arrepentimientos" on public.arrepentimientos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "Las admins borran arrepentimientos" on public.arrepentimientos;
create policy "Las admins borran arrepentimientos" on public.arrepentimientos for delete to authenticated using (public.es_admin());

-- Cualquiera puede pedir la cancelación; recibe un código de trámite al instante.
create or replace function public.crear_arrepentimiento(p_nombre text, p_email text, p_telefono text, p_pedido text, p_motivo text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_codigo text := 'AR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
begin
  if char_length(trim(p_nombre)) < 2 then raise exception 'falta el nombre'; end if;
  if trim(p_email) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'mail no válido'; end if;
  insert into public.arrepentimientos (codigo, nombre, email, telefono, pedido, motivo)
  values (v_codigo, left(trim(p_nombre), 80), left(lower(trim(p_email)), 120), nullif(left(trim(p_telefono), 40), ''),
          nullif(upper(left(trim(p_pedido), 20)), ''), nullif(left(trim(p_motivo), 1000), ''));
  return v_codigo;
end $$;
grant execute on function public.crear_arrepentimiento(text, text, text, text, text) to anon, authenticated;

-- ---------- "Avisame cuando vuelva" ----------
create table if not exists public.avisos_stock (
  id           bigint generated always as identity primary key,
  producto_id  text not null references public.productos (id) on delete cascade,
  email        text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  creado_en    timestamptz not null default now(),
  avisado_en   timestamptz,
  unique (producto_id, email)
);
alter table public.avisos_stock enable row level security;
drop policy if exists "Cualquiera pide aviso de stock" on public.avisos_stock;
create policy "Cualquiera pide aviso de stock" on public.avisos_stock
  for insert to anon, authenticated with check (avisado_en is null);
drop policy if exists "Las admins ven avisos de stock" on public.avisos_stock;
create policy "Las admins ven avisos de stock" on public.avisos_stock for select to authenticated using (public.es_admin());
drop policy if exists "Las admins borran avisos de stock" on public.avisos_stock;
create policy "Las admins borran avisos de stock" on public.avisos_stock for delete to authenticated using (public.es_admin());

-- ---------- Correo Argentino (cotización en vivo con la API MiCorreo) ----------
-- peso_gramos: el peso de cada producto ya envuelto (vacío: se usa el peso por defecto de ajustes).
-- caja_*: las medidas de la caja o sobre que usás normalmente, en centímetros.
-- envio_recargo: lo que sumás a la cotización del correo (embalaje, viaje a la sucursal…).
alter table public.productos add column if not exists peso_gramos integer check (peso_gramos is null or peso_gramos > 0);
alter table public.ajustes add column if not exists caja_alto integer not null default 5 check (caja_alto > 0);
alter table public.ajustes add column if not exists caja_ancho integer not null default 20 check (caja_ancho > 0);
alter table public.ajustes add column if not exists caja_largo integer not null default 30 check (caja_largo > 0);
alter table public.ajustes add column if not exists peso_por_defecto integer not null default 300 check (peso_por_defecto > 0);
alter table public.ajustes add column if not exists envio_recargo integer not null default 0 check (envio_recargo >= 0);

-- Con la cotización del correo, el servidor de la tienda fija el envío del pedido recién creado (antes de pagar).
-- Solo el servidor (clave secreta) puede llamarla, y solo sobre un pedido que todavía no se pagó.
create or replace function public.fijar_costo_envio(p_codigo text, p_costo integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pedido public.pedidos;
  v_subtotal integer;
begin
  select * into v_pedido from public.pedidos
   where codigo = p_codigo and pago_estado = 'pendiente' and mp_pago_id is null and entrega = 'envio' for update;
  if not found then return null; end if;
  select coalesce(sum(precio_unitario * cantidad), 0) into v_subtotal from public.pedido_items where pedido_id = v_pedido.id;
  update public.pedidos
     set costo_envio = greatest(p_costo, 0), total = v_subtotal - v_pedido.descuento + greatest(p_costo, 0)
   where id = v_pedido.id;
  return jsonb_build_object('costo_envio', greatest(p_costo, 0), 'total', v_subtotal - v_pedido.descuento + greatest(p_costo, 0));
end $$;
revoke execute on function public.fijar_costo_envio(text, integer) from public, anon, authenticated;
grant execute on function public.fijar_costo_envio(text, integer) to service_role;
