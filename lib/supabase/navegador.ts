import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CLAVE, SUPABASE_URL } from "./config";

/* Cliente del navegador, con la sesión del panel (la lee de las mismas cookies que el servidor).
   Se usa para subir los PDFs directo a Storage: pesan más de lo que Vercel deja pasar por el servidor. */
export const clienteNavegador = () => createBrowserClient(SUPABASE_URL, SUPABASE_CLAVE);

