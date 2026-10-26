-- Alas de Ángel · secciones y etiquetas.
-- Correlo después de 08-seguridad-pagos.sql (SQL Editor → New query → Run), ANTES de publicar la versión
-- de la tienda que lo usa (la tienda pide la columna `etiquetas` y, sin ella, no ve el catálogo).
-- Se puede correr más de una vez.

-- ---------- Etiquetas en productos ----------
-- Texto libre, como se ve en la tienda ("Escuela", "Vuelta al cole"). Un producto puede tener varias.
alter table public.productos add column if not exists etiquetas text[];

-- La clave pública solo lee las columnas que la tienda muestra (ver 06-seguridad.sql): se suma esta.
grant select (etiquetas) on public.productos to anon;

-- ---------- Secciones ----------
-- Una sección es una etiqueta que va en el menú "Productos" y tiene su página (/seccion/<id>).
-- id: la etiqueta en minúsculas, sin tildes y con guiones ("Vuelta al cole" → vuelta-al-cole).
-- Junta todos los productos con esa etiqueta, sean de papelería o descargables.

create table if not exists public.secciones (
  id           text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre       text not null,
  descripcion  text,
  orden        integer not null default 0
);

insert into public.secciones (id, nombre, descripcion, orden) values
  ('escuela', 'Escuela', 'Todo para el cole y la facu: cuadernos, agendas, hojas de estudio y más.', 10),
  ('emprendedores', 'Emprendedores', 'Para organizar tu emprendimiento: planners, tarjetas, etiquetas y planillas.', 20),
  ('digitales', 'Digitales', 'Plantillas en PDF que te llegan por mail y imprimís en tu casa.', 30)
on conflict (id) do nothing;

alter table public.secciones enable row level security;
drop policy if exists "Todos ven las secciones" on public.secciones;
create policy "Todos ven las secciones" on public.secciones for select using (true);
drop policy if exists "Las admins manejan secciones" on public.secciones;
create policy "Las admins manejan secciones" on public.secciones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());
