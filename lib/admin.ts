import "server-only";

import { redirect } from "next/navigation";
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
