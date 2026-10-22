-- Alas de Ángel · arreglos de seguridad del pago online.
-- Correlo después de 07-envios-cupones-y-mas.sql (SQL Editor → New query → Run), ANTES de publicar la versión
-- de la tienda que lo usa. Se puede correr más de una vez.
--
-- 1. El pedido online ya no se puede crear desde afuera: solo el servidor de la tienda (service_role), que
--    antes le pregunta el envío a Correo Argentino. Así nadie arma un pedido salteando la cotización.
-- 2. Un envío a domicilio sin precio (ni de la zona ni del correo) no se puede pagar online: se coordina por
--    WhatsApp.
-- 3. Los usos de un cupón se cuentan con los pedidos pagados más los que se están pagando (creados hace menos
--    de 30 minutos). Antes se contaban recién al aprobarse el pago, y un cupón de un solo uso se podía usar en
--    varios pedidos armados a la vez.

-- ---------- Cupones: cuántas veces se usó ----------
-- La columna `usos` sigue sumando al aprobarse cada pago (es lo que muestra el panel), pero el límite se controla
-- con esto, que también cuenta los pedidos que se están pagando.
create or replace function public.usos_cupon(p_codigo text)
returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.pedidos
   where cupon = p_codigo
     and (estado in ('pagado', 'enviado', 'entregado') or (estado = 'nuevo' and creado_en > now() - interval '30 minutes'));
$$;
revoke execute on function public.usos_cupon(text) from public, anon, authenticated;

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
  if c.usos_max is not null and public.usos_cupon(c.codigo) >= c.usos_max then
    return jsonb_build_object('error', 'Ese cupón ya se usó todas las veces que se podía. Si recién empezaste a pagar con él, esperá media hora y probá de nuevo.');
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

-- ---------- Pedido online: solo desde el servidor ----------
-- p_costo_envio: la cotización de Correo Argentino que calculó el servidor (vacío: el precio de la zona).
drop function if exists public.crear_pedido_online(text, jsonb, text, text, text, text, text, text, text, text);
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
   where p.stock is not null and p.stock < least(greatest((x ->> 'cantidad')::int, 1), 99)
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
  select v_pedido, p.id, p.nombre, p.precio, least(greatest((x ->> 'cantidad')::int, 1), 99)
    from jsonb_array_elements(p_items) x
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

-- El costo ahora se fija al crear el pedido: esto ya no hace falta.
drop function if exists public.fijar_costo_envio(text, integer);
