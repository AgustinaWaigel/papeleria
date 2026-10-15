"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";
import { TAGS, obtenerCategorias, type FilaProducto } from "@/lib/catalogo";
import { leerExcel } from "@/lib/excel";
import { COLORES, NOMBRES_DIBUJO, TIPOS, type TipoProducto } from "@/lib/productos";
import { BUCKET_FOTOS, supabaseConfigurado } from "@/lib/supabase/config";
import { clienteConSesion } from "@/lib/supabase/servidor";

export type Estado = { error?: string; ok?: string } | undefined;
export type EstadoImportar = { error?: string; ok?: string; detalles?: string[] } | undefined;

// ---------- Sesión ----------

export async function ingresar(_: Estado, datos: FormData): Promise<Estado> {
  if (!supabaseConfigurado) return { error: "Primero hay que conectar Supabase (ver supabase/LEEME.md)." };

  const supabase = await clienteConSesion();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(datos.get("email") ?? "").trim(),
    password: String(datos.get("clave") ?? ""),
  });
  if (error) return { error: "El mail o la contraseña no coinciden." };

  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta existe pero no tiene permiso para el panel. Sumala a la tabla admins." };
  }
  redirect("/admin");
}

export async function salir() {
  const supabase = await clienteConSesion();
  await supabase.auth.signOut();
  redirect("/admin/ingresar");
}

// ---------- Productos ----------

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "").trim();
const renglones = (valor: string) =>
  valor
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
// Los párrafos van separados por una línea en blanco.
const parrafos = (valor: string) =>
  valor
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
const oNull = <T,>(lista: T[]) => (lista.length > 0 ? lista : null);

const MARCA_BUCKET = `/storage/v1/object/public/${BUCKET_FOTOS}/`;
const rutaEnBucket = (url: string) => (url.includes(MARCA_BUCKET) ? decodeURIComponent(url.split(MARCA_BUCKET)[1]) : null);

export async function guardarProducto(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();

  const original = texto(datos, "original"); // vacío cuando es un producto nuevo
  const id = original || texto(datos, "id");
  const tipo = texto(datos, "tipo") as TipoProducto;
  const precio = Number(texto(datos, "precio").replace(/\D/g, ""));
  const nombre = texto(datos, "nombre");
  const cat = texto(datos, "cat");

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) return { error: "El identificador va en minúsculas, sin espacios ni tildes (por ejemplo: cuaderno-pluma)." };
  if (!nombre) return { error: "Falta el nombre." };
  if (!TIPOS.some(([t]) => t === tipo)) return { error: "Elegí en qué sección va." };
  if (!Number.isFinite(precio) || texto(datos, "precio") === "") return { error: "Falta el precio." };
  const categorias = (await obtenerCategorias())[tipo] ?? [];
  // Vacío = no se controla el stock; con número, la tienda avisa cuando se acaba.
  const stockTexto = texto(datos, "stock").replace(/\D/g, "");
  const anteriorTexto = texto(datos, "precio_anterior").replace(/\D/g, "");
  if (categorias.length > 0 && !categorias.some(([c]) => c === cat)) return { error: "Elegí una categoría." };

  // Fotos: las que quedaron (en el orden elegido) y después las nuevas.
  const quedan = datos.getAll("fotos").map(String).filter(Boolean);
  const nuevas = datos.getAll("fotos_nuevas").filter((f): f is File => f instanceof File && f.size > 0);
  const subidas: string[] = [];
  for (const archivo of nuevas) {
    if (!archivo.type.startsWith("image/")) return { error: `"${archivo.name}" no es una imagen.` };
    const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
    const ruta = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(ruta, archivo, { contentType: archivo.type });
    if (error) return { error: `No se pudo subir "${archivo.name}": ${error.message}` };
    subidas.push(supabase.storage.from(BUCKET_FOTOS).getPublicUrl(ruta).data.publicUrl);
  }

  const fila: Omit<FilaProducto, "orden"> & { orden: number } = {
    id,
    tipo,
    cat: categorias.length > 0 ? cat : null,
    nombre,
    resumen: texto(datos, "resumen"),
    detalle: texto(datos, "detalle") || null,
    precio,
    precio_anterior: anteriorTexto ? Number(anteriorTexto) : null,
    stock: stockTexto ? Number(stockTexto) : null,
    dibujo: (NOMBRES_DIBUJO.find((d) => d === texto(datos, "dibujo")) ?? "cuaderno"),
    color: (COLORES.find(([c]) => c === texto(datos, "color"))?.[0] ?? "lavanda"),
    destacado: datos.get("destacado") === "on",
    activo: datos.get("activo") === "on",
    orden: Number(texto(datos, "orden")) || 0,
    contenido: tipo === "pack" ? oNull(renglones(texto(datos, "contenido"))) : null,
    descripcion: oNull(parrafos(texto(datos, "descripcion"))),
    caracteristicas: oNull(renglones(texto(datos, "caracteristicas"))),
    fotos: oNull([...quedan, ...subidas]),
  };

  if (original) {
    const { data: antes } = await supabase.from("productos").select("fotos").eq("id", id).single();
    const { error } = await supabase.from("productos").update(fila).eq("id", id);
    if (error) return { error: `No se pudo guardar: ${error.message}` };
    // Las fotos que se sacaron del producto también se borran del bucket.
    const sacadas = ((antes?.fotos as string[] | null) ?? []).filter((f) => !quedan.includes(f)).map(rutaEnBucket);
    const rutas = sacadas.filter((r): r is string => Boolean(r));
    if (rutas.length > 0) await supabase.storage.from(BUCKET_FOTOS).remove(rutas);
  } else {
    const { error } = await supabase.from("productos").insert(fila);
    if (error) {
      return { error: error.code === "23505" ? `Ya hay un producto con el identificador "${id}".` : `No se pudo guardar: ${error.message}` };
    }
  }

  updateTag(TAGS.catalogo);
  redirect(`/admin?listo=${encodeURIComponent(nombre)}`);
}

export async function borrarProducto(datos: FormData) {
  const { supabase } = await exigirAdmin();
  const id = texto(datos, "id");

  const { data: antes } = await supabase.from("productos").select("fotos").eq("id", id).single();
  await supabase.from("productos").delete().eq("id", id);
  const rutas = ((antes?.fotos as string[] | null) ?? []).map(rutaEnBucket).filter((r): r is string => Boolean(r));
  if (rutas.length > 0) await supabase.storage.from(BUCKET_FOTOS).remove(rutas);

  updateTag(TAGS.catalogo);
  redirect("/admin");
}

/* Carga los productos de un Excel: los que ya existen (mismo identificador) se actualizan y los
   nuevos se agregan. Los que no están en la planilla quedan como estaban. Si alguna fila tiene un
   error no se guarda nada, así no queda una carga a medias. */
export async function importarExcel(_: Estado, datos: FormData): Promise<EstadoImportar> {
  const { supabase } = await exigirAdmin();
  const archivo = datos.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elegí un archivo de Excel (.xlsx)." };
  if (!archivo.name.toLowerCase().endsWith(".xlsx")) return { error: "El archivo tiene que ser .xlsx (en Excel: Guardar como → Libro de Excel)." };

  const [{ data: antes, error: errorLectura }, categorias] = await Promise.all([
    supabase.from("productos").select("*"),
    obtenerCategorias(),
  ]);
  if (errorLectura) return { error: `No se pudo leer la tabla: ${errorLectura.message}` };
  const existentes = new Map(((antes ?? []) as FilaProducto[]).map((f) => [f.id, f]));

  let leido;
  try {
    leido = await leerExcel(await archivo.arrayBuffer(), categorias, existentes);
  } catch {
    return { error: "No se pudo abrir el archivo. ¿Es un Excel (.xlsx) sin contraseña?" };
  }
  if (leido.errores.length > 0) {
    return { error: "No se cargó nada: hay que corregir estas filas y volver a subir el archivo.", detalles: leido.errores };
  }

  const { error } = await supabase.from("productos").upsert(leido.filas, { onConflict: "id" });
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  updateTag(TAGS.catalogo);
  refresh();
  const nuevos = leido.filas.filter((f) => !existentes.has(f.id)).length;
  const actualizados = leido.filas.length - nuevos;
  const partes = [nuevos && `${nuevos} ${nuevos === 1 ? "producto nuevo" : "productos nuevos"}`, actualizados && `${actualizados} ${actualizados === 1 ? "actualizado" : "actualizados"}`];
  return { ok: `Listo: ${partes.filter(Boolean).join(" y ")}. Ya se ve en la tienda.` };
}

/* Prende o apaga un sí/no de la lista sin entrar a editar: si se ve en la tienda o si va en Inicio. */
export async function alternar(datos: FormData) {
  const { supabase } = await exigirAdmin();
  const campo = texto(datos, "campo");
  if (campo !== "activo" && campo !== "destacado") return;

  await supabase
    .from("productos")
    .update({ [campo]: datos.get("valor") === "true" })
    .eq("id", texto(datos, "id"));
  updateTag(TAGS.catalogo);
  refresh(); // la lista del panel no usa caché: hay que pedirla de nuevo
}
