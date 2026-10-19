import "server-only";

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { SUPABASE_CLAVE, SUPABASE_URL } from "./config";

/* Clave secreta (Project Settings → API Keys → Secret key): saltea las reglas de la base. Vive acá y no en
   config.ts porque este archivo no puede llegar nunca al navegador ("server-only"). Sin NEXT_PUBLIC_. */
export const SUPABASE_SECRETA = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/* Cliente sin sesión, para leer el catálogo público desde funciones con "use cache"
   (ahí no se pueden leer cookies). */
export const clientePublico = () =>
  createClient(SUPABASE_URL, SUPABASE_CLAVE, { auth: { persistSession: false, autoRefreshToken: false } });

/* Cliente con la clave secreta: saltea las reglas RLS. Solo para lo que no tiene a nadie logueado
   pero tiene que escribir igual (los avisos de pago de Mercado Pago). Nunca llega al navegador. */
export const clienteServicio = () =>
  createClient(SUPABASE_URL, SUPABASE_SECRETA, { auth: { persistSession: false, autoRefreshToken: false } });

/* Cliente con la sesión de quien está en el panel. Escribe solo lo que las políticas RLS le permitan. */
export async function clienteConSesion() {
  // Supabase compara el vencimiento de la sesión con la hora actual: eso no puede ir en un
  // prerender. io() le avisa a Next que esto se resuelve recién con la visita real.
  await io();
  const almacen = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_CLAVE, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          /* Desde un componente de servidor no se pueden escribir cookies; las renueva proxy.ts. */
        }
      },
    },
  });
}
