-- Alas de Ángel · precio por cantidad (x10, x20…).
-- Correlo después de 09-secciones-y-etiquetas.sql (SQL Editor → New query → Run), ANTES de publicar la versión
-- de la tienda que lo usa. Se puede correr más de una vez.
--
-- Cada producto puede tener descuentos según cuántas unidades se lleven, por ejemplo:
--   [{"cantidad": 10, "descuento": 10}, {"cantidad": 20, "descuento": 15}]
-- = llevando 10 o más, cada unidad sale 10 % menos; llevando 20 o más, 15 % menos.
-- Los pedidos (web, online y el cupón) cobran ese precio: lo calcula la base, no el navegador.
-- También sube el máximo por producto de 99 a 999 unidades.

alter table public.productos add column if not exists por_cantidad jsonb;
grant select (por_cantidad) on public.productos to anon;

-- El precio de una unidad llevando p_cantidad: con el mayor descuento alcanzado, redondeado a pesos.
-- El mismo cálculo que precioUnitario() de lib/productos.tsx.
create or replace function public.precio_por_cantidad(p_precio integer, p_escalas jsonb, p_cantidad integer)
returns integer language sql immutable set search_path = '' as $$
  select coalesce(round(p_precio * (100 - max(least(greatest((e ->> 'descuento')::int, 0), 90))) / 100.0)::int, p_precio)
    from jsonb_array_elements(case when jsonb_typeof(p_escalas) = 'array' then p_escalas else '[]'::jsonb end) e
   where (e ->> 'cantidad')::int <= p_cantidad;
$$;
grant execute on function public.precio_por_cantidad(integer, jsonb, integer) to anon, authenticated;

-- ---------- Pedido por WhatsApp ----------
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
  select v_pedido, p.id, p.nombre, public.precio_por_cantidad(p.precio, p.por_cantidad, c.cantidad), c.cantidad
    from jsonb_array_elements(p_items) x
    cross join lateral (select least(greatest((x ->> 'cantidad')::int, 1), 999) as cantidad) c
    join public.productos p on p.id = x ->> 'id' and p.activo;

  update public.pedidos set total = coalesce((select sum(precio_unitario * cantidad) from public.pedido_items where pedido_id = v_pedido), 0)
   where id = v_pedido;
  return v_pedido;
end $$;
grant execute on function public.crear_pedido_web(text, jsonb, text) to anon, authenticated;

-- ---------- Cupón desde la bolsita ----------
create or replace function public.validar_cupon(p_codigo text, p_items jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_subtotal integer;
begin
  select coalesce(sum(public.precio_por_cantidad(p.precio, p.por_cantidad, c.cantidad) * c.cantidad), 0) into v_subtotal
    from jsonb_array_elements(p_items) x
    cross join lateral (select least(greatest((x ->> 'cantidad')::int, 1), 999) as cantidad) c
    join public.productos p on p.id = x ->> 'id' and p.activo;
  return public.descuento_cupon(p_codigo, v_subtotal);
end $$;
grant execute on function public.validar_cupon(text, jsonb) to anon, authenticated;

-- ---------- Pedido online (igual que en 08-seguridad-pagos.sql, con el precio por cantidad) ----------
create or replace function public.crear_pedido_online(
  p_codigo text, p_items jsonb, p_nombre text, p_email text, p_telefono text, p_entrega text, p_direccion text,
  p_cupon text default null, p_codigo_postal text default null, p_provincia text default null, p_costo_envio integer default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pedido bigint;
  v_falta text;
  v_subtotal integer;
  v_descuento integer := 0;
  v_cupon text;
  v_cupon_info jsonb;
  v_envio integer := 0;
  v_gratis_desde integer;
  v_resultado jsonb;
begin
  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'pedido vacío o demasiado grande';
  end if;
  if p_entrega not in ('retiro', 'envio', 'digital') then raise exception 'entrega no válida'; end if;

  select p.nombre into v_falta
    from jsonb_array_elements(p_items) x
    join public.productos p on p.id = x ->> 'id' and p.activo
   where p.stock is not null and p.stock < least(greatest((x ->> 'cantidad')::int, 1), 999)
   limit 1;
  if v_falta is not null then raise exception 'sin stock: %', v_falta; end if;

  -- Con cupón, un pedido a la vez: así dos pedidos simultáneos no pasan los dos el control de usos.
  if nullif(trim(p_cupon), '') is not null then
    perform 1 from public.cupones where codigo = upper(trim(p_cupon)) for update;
  end if;

  insert into public.pedidos (codigo, origen, cliente_nombre, cliente_email, cliente_telefono, cliente_contacto,
                              entrega, direccion, medio_pago, pago_estado)
  values (left(p_codigo, 20), 'web', nullif(left(trim(p_nombre), 80), ''), nullif(left(lower(trim(p_email)), 120), ''),
          nullif(left(trim(p_telefono), 40), ''), nullif(left(trim(p_telefono), 40), ''),
          p_entrega, nullif(left(trim(p_direccion), 300), ''), 'Mercado Pago', 'pendiente')
  returning id into v_pedido;

  insert into public.pedido_items (pedido_id, producto_id, nombre, precio_unitario, cantidad)
  select v_pedido, p.id, p.nombre, public.precio_por_cantidad(p.precio, p.por_cantidad, c.cantidad), c.cantidad
    from jsonb_array_elements(p_items) x
    cross join lateral (select least(greatest((x ->> 'cantidad')::int, 1), 999) as cantidad) c
    join public.productos p on p.id = x ->> 'id' and p.activo;

  select coalesce(sum(precio_unitario * cantidad), 0) into v_subtotal from public.pedido_items where pedido_id = v_pedido;

  if nullif(trim(p_cupon), '') is not null then
    -- Se revisa antes de que este pedido tenga el cupón, así no se cuenta a sí mismo.
    v_cupon_info := public.descuento_cupon(p_cupon, v_subtotal);
    if v_cupon_info ? 'error' then raise exception 'cupón: %', v_cupon_info ->> 'error'; end if;
    v_cupon := v_cupon_info ->> 'codigo';
    v_descuento := (v_cupon_info ->> 'descuento')::int;
  end if;

  if p_entrega = 'envio' then
    if p_costo_envio is not null then
      select envio_gratis_desde into v_gratis_desde from public.ajustes limit 1;
      v_envio := case when v_gratis_desde is not null and v_subtotal - v_descuento >= v_gratis_desde then 0 else greatest(p_costo_envio, 0) end;
    else
      v_envio := public.costo_envio(p_provincia, p_codigo_postal, v_subtotal - v_descuento);
    end if;
    if v_envio is null then raise exception 'envío sin precio'; end if;
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
revoke execute on function public.crear_pedido_online(text, jsonb, text, text, text, text, text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.crear_pedido_online(text, jsonb, text, text, text, text, text, text, text, text, integer) to service_role;
