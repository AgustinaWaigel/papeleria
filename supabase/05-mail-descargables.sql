-- Alas de Ángel · mail con los PDF de los descargables.
-- Correlo después de 04-pagos-online.sql (SQL Editor → New query → Run). Se puede correr más de una vez.

-- Cuándo se mandó el mail con los PDF. Mientras está vacío, la tienda lo manda cuando el pedido
-- queda pagado; una vez enviado no se repite solo (desde el panel se puede reenviar).
alter table public.pedidos add column if not exists pdf_enviado_en timestamptz;
