import "server-only";

import { redirect } from "next/navigation";
import { BUCKET_FOTOS } from "./supabase/config";
import { clienteConSesion } from "./supabase/servidor";

/* Quién está en el panel. Devuelve null si no hay sesión o si el mail no figura en `admins`.
   Las políticas RLS vuelven a chequear lo mismo en la base: esto es para la interfaz. */
export async function sesionAdmin() {
  const supabase = await clienteConSesion();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;
  if (!email) return null;

  const { data: esAdmin } = await supabase.rpc("es_admin");
  return esAdmin ? { supabase, email: String(email) } : null;
}

export async function exigirAdmin() {
  const sesion = await sesionAdmin();
  if (!sesion) redirect("/admin/ingresar");
  return sesion;
}

/* Sube las fotos nuevas de un campo del formulario a una carpeta del bucket público y devuelve sus direcciones
   (o el primer error). Lo usan las fotos y hojas de muestra de los productos y las fotos de clientas. */
export async function subirFotos(supabase: Awaited<ReturnType<typeof exigirAdmin>>["supabase"], carpeta: string, campo: FormDataEntryValue[]) {
  const subidas: string[] = [];
  for (const archivo of campo.filter((f): f is File => f instanceof File && f.size > 0)) {
    if (!archivo.type.startsWith("image/")) return { error: `"${archivo.name}" no es una imagen.` };
    const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
    const ruta = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(ruta, archivo, { contentType: archivo.type });
    if (error) return { error: `No se pudo subir "${archivo.name}": ${error.message}` };
    subidas.push(supabase.storage.from(BUCKET_FOTOS).getPublicUrl(ruta).data.publicUrl);
  }
  return subidas;
}

type Supabase = Awaited<ReturnType<typeof exigirAdmin>>["supabase"];

/* Los descargables, para elegir "el mismo producto en el otro formato" en el formulario. */
export async function otrosDescargables(supabase: Supabase): Promise<[string, string][]> {
  const { data } = await supabase.from("productos").select("id, nombre").eq("tipo", "descargable").order("nombre");
  return (data ?? []).map((d) => [d.id as string, d.nombre as string]);
}

/* Une dos descargables como el mismo producto en dos formatos (o lo desune, con `otra` vacío): el vínculo va en
   los dos lados, y quien estaba unido antes con cualquiera de los dos queda suelto. */
export async function unirFormatos(supabase: Supabase, id: string, otra: string | null, antes: string | null) {
  if (antes && antes !== otra) await supabase.from("productos").update({ otra_version: null }).eq("id", antes).eq("otra_version", id);
  if (!otra) return;
  await supabase.from("productos").update({ otra_version: null }).eq("otra_version", otra).neq("id", id);
  await supabase.from("productos").update({ otra_version: id }).eq("id", otra);
}

const MARCA_BUCKET = `/storage/v1/object/public/${BUCKET_FOTOS}/`;

/* De la dirección pública de una foto, dónde está dentro del bucket (null si no es del bucket). */
export const rutaEnBucket = (url: string) => (url.includes(MARCA_BUCKET) ? decodeURIComponent(url.split(MARCA_BUCKET)[1]) : null);
