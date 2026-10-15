"use server";

/* Acciones del panel para categorías, reseñas y suscriptores. */

import { refresh, updateTag } from "next/cache";
import { exigirAdmin } from "@/lib/admin";
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
