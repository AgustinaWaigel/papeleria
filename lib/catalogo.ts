/* El catálogo de la tienda. Sale de Supabase y queda en caché hasta que el panel lo cambie
   (updateTag con los TAGS de abajo). Sin Supabase configurado, usa lib/productos.tsx. */

import { cacheLife, cacheTag } from "next/cache";
import { ABIERTAS } from "./paginas";
import { supabaseConfigurado } from "./supabase/config";
import { clientePublico } from "./supabase/servidor";
import {
  CATEGORIAS,
  PRODUCTOS,
  type Categorias,
  type ColorProducto,
  type Escala,
  type Formato,
  type NombreDibujo,
  type Producto,
  type TipoProducto,
} from "./productos";
import type { AjustesEnvio } from "./seguimiento";
import type { Zona } from "./zonas";

export const TAGS = {
  catalogo: "productos",
  categorias: "categorias",
  secciones: "secciones",
  resenas: "resenas",
  ajustes: "ajustes",
  clientas: "fotos-clientas",
} as const;

/* Una fila de la tabla tal como la devuelve Supabase (ver supabase/*.sql). */
export type FilaProducto = {
  id: string;
  tipo: TipoProducto;
  cat: string | null;
  nombre: string;
  resumen: string;
  detalle: string | null;
  precio: number;
  precio_anterior?: number | null;
  stock?: number | null;
  dibujo: NombreDibujo;
  color: ColorProducto;
  destacado: boolean;
  contenido: string[] | null;
  fotos: string[] | null;
  descripcion: string[] | null;
  caracteristicas: string[] | null;
  orden: number;
  activo: boolean;
  archivo?: string | null; // el PDF de un descargable, en el bucket privado (supabase/04-pagos-online.sql)
  peso_gramos?: number | null; // para cotizar con Correo Argentino (supabase/07-envios-cupones-y-mas.sql)
  etiquetas?: string[] | null; // supabase/09-secciones-y-etiquetas.sql
  por_cantidad?: Escala[] | null; // supabase/10-precio-por-cantidad.sql
  muestras?: string[] | null; // supabase/11-muestras-regalo-fotos-presupuestos.sql
  formato?: Formato | null; // mismo script
  otra_version?: string | null; // mismo script
};

const lista = (valor: string[] | null) => (valor && valor.length > 0 ? valor : undefined);

export function desdeFila(f: FilaProducto): Producto {
  return {
    id: f.id,
    tipo: f.tipo,
    cat: f.cat ?? undefined,
    nombre: f.nombre,
    desc: f.resumen,
    detalle: f.detalle ?? undefined,
    precio: f.precio,
    precioAnterior: f.precio_anterior ?? undefined,
    stock: f.stock ?? undefined,
    dibujo: f.dibujo,
    color: f.color,
    destacado: f.destacado,
    contenido: lista(f.contenido),
    fotos: lista(f.fotos),
    descripcion: lista(f.descripcion),
    caracteristicas: lista(f.caracteristicas),
    etiquetas: lista(f.etiquetas ?? null),
    porCantidad: f.por_cantidad && f.por_cantidad.length > 0 ? f.por_cantidad : undefined,
    muestras: lista(f.muestras ?? null),
    formato: f.formato ?? undefined,
    otraVersion: f.otra_version ?? undefined,
  };
}

/* Lo que la tienda muestra de cada producto. Las mismas columnas que supabase/06-seguridad.sql (y 09 a 11) deja
   leer con la clave pública: si sumás una columna que la tienda tiene que ver, va en los dos lados. */
const COLUMNAS_PUBLICAS =
  "id, tipo, cat, nombre, resumen, detalle, precio, precio_anterior, stock, dibujo, color, destacado, contenido, fotos, descripcion, caracteristicas, etiquetas, por_cantidad, muestras, formato, otra_version, orden, activo";

export async function obtenerCatalogo(): Promise<Producto[]> {
  "use cache";
  cacheTag(TAGS.catalogo);

  if (!supabaseConfigurado) {
    cacheLife("max");
    return PRODUCTOS;
  }

  const { data, error } = await clientePublico()
    .from("productos")
    // Columnas con nombre y no "*": la clave pública no puede leer `archivo` (supabase/06-seguridad.sql).
    .select(COLUMNAS_PUBLICAS)
    .eq("activo", true)
    .order("orden")
    .order("nombre");

  if (error) {
    // Mejor una tienda con el catálogo de respaldo que una tienda rota; se reintenta en minutos.
    console.error("No se pudo leer el catálogo de Supabase:", error.message);
    cacheLife("minutes");
    return PRODUCTOS;
  }
  // Los cambios del panel se ven al instante por el tag; el plazo es solo un seguro.
  cacheLife("days");
  // Los packs no se muestran mientras su sección esté guardada (ver lib/paginas.ts).
  return (data as FilaProducto[]).map(desdeFila).filter((p) => ABIERTAS.packs || p.tipo !== "pack");
}

export async function obtenerProducto(id: string) {
  return (await obtenerCatalogo()).find((p) => p.id === id);
}

export async function obtenerCategorias(): Promise<Categorias> {
  "use cache";
  cacheTag(TAGS.categorias);

  if (!supabaseConfigurado) {
    cacheLife("max");
    return CATEGORIAS;
  }
  const { data, error } = await clientePublico().from("categorias").select("id, tipo, nombre").order("orden").order("nombre");
  if (error) {
    // Pasa si todavía no se corrió supabase/02-pedidos-y-mas.sql.
    cacheLife("minutes");
    return CATEGORIAS;
  }
  cacheLife("days");
  const categorias: Categorias = {};
  for (const c of data as { id: string; tipo: TipoProducto; nombre: string }[]) {
    (categorias[c.tipo] ??= []).push([c.id, c.nombre]);
  }
  return categorias;
}

/* Las secciones del menú "Productos" (supabase/09-secciones-y-etiquetas.sql). Cada una junta los productos
   que tienen su etiqueta. */
export type SeccionMenu = { id: string; nombre: string; descripcion: string | null };

export async function obtenerSecciones(): Promise<SeccionMenu[]> {
  "use cache";
  cacheTag(TAGS.secciones);

  if (!supabaseConfigurado) {
    cacheLife("max");
    return [];
  }
  const { data, error } = await clientePublico().from("secciones").select("id, nombre, descripcion").order("orden").order("nombre");
  if (error) {
    // Pasa si todavía no se corrió supabase/09-secciones-y-etiquetas.sql.
    cacheLife("minutes");
    return [];
  }
  cacheLife("days");
  return data as SeccionMenu[];
}

/* Lo que se muestra en la bolsita sobre el envío (ver AjustesEnvio en lib/seguimiento.ts). */
export async function obtenerAjustesEnvio(): Promise<AjustesEnvio> {
  "use cache";
  cacheTag(TAGS.ajustes);
  const sinCosto: AjustesEnvio = { costo: null, gratisDesde: null, detalle: null, zonas: [] };
  if (!supabaseConfigurado) {
    cacheLife("max");
    return sinCosto;
  }
  const [{ data, error }, { data: zonas }] = await Promise.all([
    clientePublico().from("ajustes").select("envio_costo, envio_gratis_desde, envio_detalle").maybeSingle(),
    clientePublico().from("zonas_envio").select("id, nombre, provincias, codigos_postales, costo, orden").order("orden"),
  ]);
  if (error || !data) {
    cacheLife("minutes");
    return sinCosto;
  }
  cacheLife("days");
  return { costo: data.envio_costo, gratisDesde: data.envio_gratis_desde, detalle: data.envio_detalle, zonas: (zonas ?? []) as Zona[] };
}

/* El descargable que se regala al suscribirse (supabase/11-muestras-regalo-fotos-presupuestos.sql), o null. */
export async function obtenerRegalo(): Promise<{ id: string; nombre: string } | null> {
  "use cache";
  cacheTag(TAGS.ajustes, TAGS.catalogo);
  if (!supabaseConfigurado) {
    cacheLife("max");
    return null;
  }
  const { data, error } = await clientePublico().from("ajustes").select("regalo_producto").maybeSingle();
  // Sin la columna (todavía no se corrió el script) se reintenta en minutos.
  if (error) cacheLife("minutes");
  else cacheLife("days");
  if (!data?.regalo_producto) return null;
  const producto = (await obtenerCatalogo()).find((p) => p.id === data.regalo_producto);
  return producto ? { id: producto.id, nombre: producto.nombre } : null;
}

/* "Así lo usan": las fotos de clientas, de un producto o todas (las más nuevas primero). */
export type FotoClienta = { id: number; foto: string; autora: string | null; producto_id: string | null };

export async function obtenerFotosClientas(): Promise<FotoClienta[]> {
  "use cache";
  cacheTag(TAGS.clientas);
  if (!supabaseConfigurado) {
    cacheLife("max");
    return [];
  }
  const { data, error } = await clientePublico()
    .from("fotos_clientas")
    .select("id, foto, autora, producto_id")
    .order("orden")
    .order("creado_en", { ascending: false });
  if (error) cacheLife("minutes");
  else cacheLife("days");
  return (data as FotoClienta[] | null) ?? [];
}

export type Resena = { id: number; nombre: string; texto: string; puntaje: number; creado_en: string };

export async function obtenerResenas(productoId: string): Promise<Resena[]> {
  "use cache";
  cacheTag(TAGS.resenas);

  if (!supabaseConfigurado) {
    cacheLife("max");
    return [];
  }
  const { data, error } = await clientePublico()
    .from("resenas")
    .select("id, nombre, texto, puntaje, creado_en")
    .eq("producto_id", productoId)
    .eq("aprobada", true)
    .order("creado_en", { ascending: false });
  if (error) cacheLife("minutes");
  else cacheLife("days");
  return (data as Resena[] | null) ?? [];
}
