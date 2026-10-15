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
  type NombreDibujo,
  type Producto,
  type TipoProducto,
} from "./productos";

export const TAGS = { catalogo: "productos", categorias: "categorias", resenas: "resenas" } as const;

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
  };
}

export async function obtenerCatalogo(): Promise<Producto[]> {
  "use cache";
  cacheTag(TAGS.catalogo);

  if (!supabaseConfigurado) {
    cacheLife("max");
    return PRODUCTOS;
  }

  const { data, error } = await clientePublico()
    .from("productos")
    .select("*")
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
