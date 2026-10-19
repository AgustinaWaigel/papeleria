-- Alas de Ángel · pago online con Mercado Pago y seguimiento de pedidos.
-- Correlo después de 02-pedidos-y-mas.sql (SQL Editor → New query → Run). Se puede correr más de una vez.

-- ---------- Datos nuevos de cada pedido ----------
-- entrega: retiro (lo busca), envio (a domicilio, el costo se coordina) o digital (solo descargables).
-- clave: la parte secreta del link de seguimiento que recibe quien compra.
-- pago_estado: lo que dice Mercado Pago (approved, pending, in_process, rejected, cancelled, refunded…).

alter table public.pedidos add column if not exists cliente_email text;
alter table public.pedidos add column if not exists cliente_telefono text;
alter table public.pedidos add column if not exists entrega text check (entrega in ('retiro', 'envio', 'digital'));
alter table public.pedidos add column if not exists direccion text;
alter table public.pedidos add column if not exists seguimiento text;
alter table public.pedidos add column if not exists pago_estado text;
alter table public.pedidos add column if not exists mp_pago_id text;
alter table public.pedidos add column if not exists clave text not null default replace(gen_random_uuid()::text, '-', '');

-- ---------- PDFs de los descargables ----------
-- archivo: dónde está el PDF dentro del bucket privado `descargables`. Nadie lo puede bajar directo:
-- la tienda arma un link que vence, y solo para pedidos pagados.

alter table public.productos add column if not exists archivo text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('descargables', 'descargables', false, 52428800, array['application/pdf', 'application/zip'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Las admins suben descargables" on storage.objects;
create policy "Las admins suben descargables" on storage.objects
  for insert to authenticated with check (bucket_id = 'descargables' and public.es_admin());
drop policy if exists "Las admins ven descargables" on storage.objects;
create policy "Las admins ven descargables" on storage.objects
  for select to authenticated using (bucket_id = 'descargables' and public.es_admin());
drop policy if exists "Las admins cambian descargables" on storage.objects;
create policy "Las admins cambian descargables" on storage.objects
  for update to authenticated using (bucket_id = 'descargables' and public.es_admin());
drop policy if exists "Las admins borran descargables" on storage.objects;
create policy "Las admins borran descargables" on storage.objects
  for delete to authenticated using (bucket_id = 'descargables' and public.es_admin());

-- ---------- Pedido con pago online ----------
-- Lo crea la tienda antes de mandar a Mercado Pago. Los precios salen de la base, no del navegador,
-- y si algo ya no tiene stock suficiente, no se crea.
-- p_items: [{"id": "cuaderno-pluma", "cantidad": 2}, …]
create or replace function public.crear_pedido_online(
  p_codigo text, p_items jsonb, p_nombre text, p_email text, p_telefono text, p_entrega text, p_direccion text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_pedido bigint;
  v_falta text;
  v_resultado jsonb;
begin
  if jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'pedido vacío o demasiado grande';
  end if;

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

  update public.pedidos set total = coalesce((select sum(precio_unitario * cantidad) from public.pedido_items where pedido_id = v_pedido), 0)
   where id = v_pedido;

  select jsonb_build_object(
           'codigo', pe.codigo, 'clave', pe.clave, 'total', pe.total,
           'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.producto_id, 'nombre', i.nombre,
                                                                  'precio', i.precio_unitario, 'cantidad', i.cantidad))
                                from public.pedido_items i where i.pedido_id = pe.id), '[]'::jsonb))
    into v_resultado
    from public.pedidos pe where pe.id = v_pedido;
  return v_resultado;
end $$;
grant execute on function public.crear_pedido_online(text, jsonb, text, text, text, text, text) to anon, authenticated;

-- ---------- Seguimiento ----------
-- Quien compra ve su pedido con el código y la clave del link. Sin la clave no se ve nada.
create or replace function public.ver_pedido(p_codigo text, p_clave text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
           'codigo', p.codigo, 'estado', p.estado, 'fecha', p.fecha, 'total', p.total,
           'cliente_nombre', p.cliente_nombre, 'entrega', p.entrega, 'direccion', p.direccion,
           'seguimiento', p.seguimiento, 'medio_pago', p.medio_pago, 'pago_estado', p.pago_estado,
           'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.producto_id, 'nombre', i.nombre,
                                                                  'precio', i.precio_unitario, 'cantidad', i.cantidad) order by i.id)
                                from public.pedido_items i where i.pedido_id = p.id), '[]'::jsonb))
    from public.pedidos p
   where p.codigo = p_codigo and p.clave = p_clave;
$$;
grant execute on function public.ver_pedido(text, text) to anon, authenticated;

-- ---------- Avisos de Mercado Pago ----------
-- Solo el servidor de la tienda puede llamarla (con la clave secreta de Supabase), después de
-- confirmar el pago con la API de Mercado Pago. Un pago aprobado por el total pasa el pedido a pagado
-- y descuenta el stock.
create or replace function public.registrar_pago_mp(p_codigo text, p_pago_id text, p_estado text, p_monto numeric)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_pedido public.pedidos;
begin
  select * into v_pedido from public.pedidos where codigo = p_codigo for update;
  if not found then return; end if;
  -- Un pago aprobado no se pisa con avisos viejos de intentos rechazados.
  if v_pedido.pago_estado = 'approved' and p_estado in ('pending', 'in_process', 'rejected', 'cancelled') then return; end if;

  update public.pedidos set pago_estado = p_estado, mp_pago_id = p_pago_id where id = v_pedido.id;
  if p_estado = 'approved' and p_monto >= v_pedido.total and v_pedido.estado = 'nuevo' then
    update public.pedidos set estado = 'pagado' where id = v_pedido.id;
    perform public.acomodar_stock(v_pedido.id);
  end if;
end $$;
revoke execute on function public.registrar_pago_mp(text, text, text, numeric) from public, anon, authenticated;
grant execute on function public.registrar_pago_mp(text, text, text, numeric) to service_role;

-- Si Mercado Pago no llegó a crear el link de pago, el pedido recién creado se borra.
create or replace function public.descartar_pedido_online(p_codigo text)
returns void language sql security definer set search_path = '' as $$
  delete from public.pedidos where codigo = p_codigo and pago_estado = 'pendiente' and mp_pago_id is null and not stock_descontado;
$$;
revoke execute on function public.descartar_pedido_online(text) from public, anon, authenticated;
grant execute on function public.descartar_pedido_online(text) to service_role;
