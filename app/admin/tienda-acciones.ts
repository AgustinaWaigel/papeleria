"use server";

/* Acciones del panel para categorías, reseñas y suscriptores. */

import { refresh, updateTag } from "next/cache";
import { exigirAdmin } from "@/lib/admin";
import { ambienteCorreo, armarPaquete, correoConfigurado, cotizar } from "@/lib/correo";
import { clienteServicio } from "@/lib/supabase/servidor";
import { numeroCP } from "@/lib/zonas";
import { TAGS } from "@/lib/catalogo";
import type { Estado } from "./acciones";

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "").trim();

const aIdentificador = (valor: string) =>
  valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ---------- Categorías ----------

export async function crearCategoria(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const nombre = texto(datos, "nombre");
  const tipo = texto(datos, "tipo");
  const id = aIdentificador(nombre);
  if (!nombre || !id) return { error: "Escribí el nombre de la categoría." };
  if (tipo !== "fisico" && tipo !== "descargable") return { error: "Sección no válida." };

  const { error } = await supabase.from("categorias").insert({ id, tipo, nombre, orden: Number(texto(datos, "orden")) || 999 });
  if (error) return { error: error.code === "23505" ? `Ya existe una categoría «${id}».` : error.message };

  updateTag(TAGS.categorias);
  refresh();
  return { ok: `Listo: «${nombre}» ya aparece en los filtros (en cuanto tenga productos).` };
}

/* Desde el formulario de producto: crea la categoría y la devuelve para elegirla ahí mismo.
   Si ya existe en esa sección, devuelve la que hay. Va al final de la lista. */
export async function agregarCategoria(tipo: string, nombre: string): Promise<{ categoria?: [string, string]; error?: string }> {
  const { supabase } = await exigirAdmin();
  nombre = nombre.trim();
  const id = aIdentificador(nombre);
  if (!nombre || !id) return { error: "Escribí el nombre de la categoría." };
  if (tipo !== "fisico" && tipo !== "descargable") return { error: "Esta sección no usa categorías." };

  const { data: existente } = await supabase.from("categorias").select("tipo, nombre").eq("id", id).maybeSingle();
  if (existente) {
    return existente.tipo === tipo
      ? { categoria: [id, existente.nombre] }
      : { error: `Ya hay una categoría «${existente.nombre}» en la otra sección. Usá otro nombre.` };
  }

  const { data: ultima } = await supabase.from("categorias").select("orden").eq("tipo", tipo).order("orden", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("categorias").insert({ id, tipo, nombre, orden: (ultima?.orden ?? 0) + 10 });
  if (error) return { error: `No se pudo crear: ${error.message}` };

  updateTag(TAGS.categorias);
  return { categoria: [id, nombre] };
}

export async function guardarCategoria(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const nombre = texto(datos, "nombre");
  if (!nombre) return { error: "El nombre no puede quedar vacío." };

  const { error } = await supabase
    .from("categorias")
    .update({ nombre, orden: Number(texto(datos, "orden")) || 0 })
    .eq("id", texto(datos, "id"));
  if (error) return { error: error.message };

  updateTag(TAGS.categorias);
  refresh();
  return { ok: "Guardado." };
}

export async function borrarCategoria(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const id = texto(datos, "id");

  // Una categoría con productos no se borra: quedarían fuera de todos los filtros.
  const { count } = await supabase.from("productos").select("id", { count: "exact", head: true }).eq("cat", id);
  if (count) return { error: `Tiene ${count} ${count === 1 ? "producto" : "productos"}. Pasalos a otra categoría antes de borrarla.` };

  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) return { error: error.message };

  updateTag(TAGS.categorias);
  refresh();
  return undefined;
}

// ---------- Reseñas ----------

export async function moderarResena(datos: FormData) {
  const { supabase } = await exigirAdmin();
  const id = Number(texto(datos, "id"));

  if (texto(datos, "accion") === "borrar") await supabase.from("resenas").delete().eq("id", id);
  else await supabase.from("resenas").update({ aprobada: texto(datos, "accion") === "aprobar" }).eq("id", id);

  updateTag(TAGS.resenas);
  refresh();
}

// ---------- Suscriptores ----------

export async function borrarSuscriptor(datos: FormData) {
  const { supabase } = await exigirAdmin();
  await supabase.from("suscriptores").delete().eq("email", texto(datos, "email"));
  refresh();
}

// ---------- Envíos ----------

const pesos = (datos: FormData, campo: string) => {
  const limpio = texto(datos, campo).replace(/\D/g, "");
  return limpio ? Number(limpio) : null;
};

export async function guardarEnvio(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase
    .from("ajustes")
    .update({
      envio_costo: pesos(datos, "envio_costo"),
      envio_gratis_desde: pesos(datos, "envio_gratis_desde") || null,
      envio_detalle: texto(datos, "envio_detalle").slice(0, 200) || null,
    })
    .eq("id", true);
  if (error) return { error: `No se pudo guardar: ${error.message}. ¿Corriste supabase/07-envios-cupones-y-mas.sql?` };
  updateTag(TAGS.ajustes);
  refresh();
  return { ok: "Guardado. Ya se ve en la bolsita." };
}

// ---------- Cupones ----------

export async function crearCupon(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const codigo = texto(datos, "codigo").toUpperCase().replace(/\s+/g, "");
  const tipo = texto(datos, "tipo");
  const valor = pesos(datos, "valor");
  if (!/^[A-Z0-9-]{3,30}$/.test(codigo)) return { error: "El código va en mayúsculas, sin espacios ni tildes, de 3 a 30 letras o números (por ejemplo: BIENVENIDA10)." };
  if (tipo !== "porcentaje" && tipo !== "monto") return { error: "Elegí si descuenta un porcentaje o un monto." };
  if (!valor) return { error: "Falta cuánto descuenta." };
  if (tipo === "porcentaje" && valor > 100) return { error: "Un porcentaje va de 1 a 100." };

  const { error } = await supabase.from("cupones").insert({
    codigo,
    tipo,
    valor,
    minimo: pesos(datos, "minimo") ?? 0,
    vence: texto(datos, "vence") || null,
    usos_max: pesos(datos, "usos_max") || null,
  });
  if (error) return { error: error.code === "23505" ? `Ya existe el cupón ${codigo}.` : `No se pudo crear: ${error.message}` };
  refresh();
  return { ok: `Listo: el cupón ${codigo} ya se puede usar.` };
}

export async function alternarCupon(datos: FormData) {
  const { supabase } = await exigirAdmin();
  await supabase.from("cupones").update({ activo: datos.get("activo") === "true" }).eq("codigo", texto(datos, "codigo"));
  refresh();
}

export async function borrarCupon(datos: FormData) {
  const { supabase } = await exigirAdmin();
  await supabase.from("cupones").delete().eq("codigo", texto(datos, "codigo"));
  refresh();
}

// ---------- Arrepentimientos ----------

export async function atenderArrepentimiento(datos: FormData) {
  const { supabase } = await exigirAdmin();
  await supabase
    .from("arrepentimientos")
    .update({ estado: datos.get("atendido") === "true" ? "atendido" : "nuevo" })
    .eq("id", Number(texto(datos, "id")));
  refresh();
}

export async function borrarArrepentimiento(datos: FormData) {
  const { supabase } = await exigirAdmin();
  await supabase.from("arrepentimientos").delete().eq("id", Number(texto(datos, "id")));
  refresh();
}

// ---------- Zonas de envío ----------

/* Los datos de una zona desde el formulario: provincias tildadas y códigos postales separados por comas. */
function datosZona(datos: FormData) {
  const provincias = datos.getAll("provincias").map(String).filter((l) => /^[A-Z]$/.test(l));
  const codigos = [...new Set(texto(datos, "codigos_postales").match(/\d{4}/g) ?? [])];
  return { nombre: texto(datos, "nombre").slice(0, 80), provincias, codigos_postales: codigos, costo: pesos(datos, "costo"), orden: Number(texto(datos, "orden")) || 0 };
}

export async function crearZona(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const zona = datosZona(datos);
  if (!zona.nombre) return { error: "Poné un nombre para la zona." };
  const { data: ultima } = await supabase.from("zonas_envio").select("orden").order("orden", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("zonas_envio").insert({ ...zona, orden: (ultima?.orden ?? 0) + 10 });
  if (error) return { error: `No se pudo crear: ${error.message}` };
  updateTag(TAGS.ajustes);
  refresh();
  return { ok: `Listo: «${zona.nombre}» creada. Tildale las provincias o los códigos postales.` };
}

export async function guardarZona(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const zona = datosZona(datos);
  if (!zona.nombre) return { error: "El nombre no puede quedar vacío." };
  if (zona.provincias.length === 0 && zona.codigos_postales.length === 0) return { error: "Tildá al menos una provincia o poné un código postal." };
  const { error } = await supabase.from("zonas_envio").update(zona).eq("id", Number(texto(datos, "id")));
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  updateTag(TAGS.ajustes);
  refresh();
  return { ok: "Guardada." };
}

export async function borrarZona(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.from("zonas_envio").delete().eq("id", Number(texto(datos, "id")));
  if (error) return { error: `No se pudo borrar: ${error.message}` };
  updateTag(TAGS.ajustes);
  refresh();
  return { ok: "Borrada." };
}

// ---------- Correo Argentino ----------

export async function guardarCaja(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const medida = (campo: string) => Math.min(Math.max(pesos(datos, campo) ?? 0, 1), 200);
  const { error } = await supabase
    .from("ajustes")
    .update({
      caja_alto: medida("caja_alto"),
      caja_ancho: medida("caja_ancho"),
      caja_largo: medida("caja_largo"),
      peso_por_defecto: Math.max(pesos(datos, "peso_por_defecto") ?? 300, 1),
      envio_recargo: pesos(datos, "envio_recargo") ?? 0,
    })
    .eq("id", true);
  if (error) return { error: `No se pudo guardar: ${error.message}. ¿Corriste supabase/07-envios-cupones-y-mas.sql?` };
  refresh();
  return { ok: "Guardado." };
}

/* "Probar cotización": un paquete de un producto con el peso por defecto, al código postal que se escriba. */
export async function probarCorreo(_: Estado, datos: FormData): Promise<Estado> {
  await exigirAdmin();
  if (!correoConfigurado) return { error: "Todavía no está conectado: faltan las credenciales en .env.local (ver supabase/LEEME.md)." };
  const cp = texto(datos, "cp");
  if (!numeroCP(cp)) return { error: "Escribí un código postal de 4 números." };
  try {
    const { data: uno } = await clienteServicio().from("productos").select("id").neq("tipo", "descargable").limit(1).maybeSingle();
    const paquete = await armarPaquete(uno ? [{ id: uno.id, cantidad: 1 }] : []);
    const c = await cotizar(cp, { ...paquete, peso: paquete.peso > 1 ? paquete.peso : 300 });
    if (!c) return { error: "Correo Argentino no devolvió tarifas a domicilio para ese código postal." };
    const dias = c.diasMin && c.diasMax ? `, llega en ${c.diasMin} a ${c.diasMax} días hábiles` : "";
    return { ok: `Conectado (${ambienteCorreo}). ${c.servicio} a ${cp}: ${c.costo.toLocaleString("es-AR")} pesos con el recargo${dias}.` };
  } catch (e) {
    return { error: `Correo Argentino respondió con un error: ${e instanceof Error ? e.message : String(e)}` };
  }
}
