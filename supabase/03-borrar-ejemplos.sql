-- Alas de Ángel Papelería · borra los productos de ejemplo que cargaba semilla.sql.
-- Correlo una sola vez en Supabase → SQL Editor. Solo toca esos identificadores:
-- los productos que hayas cargado vos quedan como están.

delete from public.productos
where id in (
  'cuaderno-pluma',
  'cuaderno-nube',
  'cuaderno-amanecer',
  'libreta-halo',
  'agenda-2027',
  'planner-escritorio',
  'stickers-cielo',
  'stickers-habitos',
  'washi-amanecer',
  'lapiceras-pastel',
  'resaltadores-suaves',
  'tarjetas-gracias',
  'block-lista',
  'pdf-planner-semanal',
  'pdf-planner-mensual',
  'pdf-habitos',
  'pdf-cornell',
  'pdf-examenes',
  'pdf-horario',
  'pdf-menu',
  'pdf-presupuesto',
  'pdf-etiquetas',
  'pdf-cumple',
  'pdf-tarjetas-regalo',
  'pack-primer-vuelo',
  'pack-vuelta-a-clases',
  'pack-escritorio',
  'pack-agradecer'
);
