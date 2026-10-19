-- Alas de Ángel · ajustes de seguridad.
-- Correlo DESPUÉS de publicar la versión de la tienda que lo menciona (la anterior pedía todas las columnas
-- de productos y, con esto, dejaría de ver el catálogo). Se puede correr más de una vez.

-- La clave pública (la que viaja al navegador) solo lee las columnas que la tienda muestra.
-- `archivo` (dónde está guardado el PDF de un descargable) queda solo para el panel y el servidor.
revoke select on public.productos from anon;
grant select (id, tipo, cat, nombre, resumen, detalle, precio, precio_anterior, stock, dibujo, color, destacado,
              contenido, fotos, descripcion, caracteristicas, orden, activo, creado_en, actualizado_en)
  on public.productos to anon;
