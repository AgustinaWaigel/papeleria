import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_CLAVE, SUPABASE_URL, supabaseConfigurado } from "./lib/supabase/config";

/* Guarda la puerta del panel: renueva la sesión de Supabase (las cookies vencen) y manda a
   /admin/ingresar a quien no inició sesión. Que la cuenta sea admin lo chequea cada página. */
export async function proxy(request: NextRequest) {
  if (!supabaseConfigurado) return NextResponse.next();

  let respuesta = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_CLAVE, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims);
  const enIngreso = request.nextUrl.pathname === "/admin/ingresar";

  // Al revés (con sesión en /admin/ingresar) no se redirige: una cuenta que dejó de ser admin
  // rebotaría entre las dos páginas.
  if (!conSesion && !enIngreso) return NextResponse.redirect(new URL("/admin/ingresar", request.url));
  return respuesta;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
