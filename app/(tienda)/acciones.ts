"use server";

/* Lo que la tienda le pide al servidor sin que haya nadie logueado. Todo pasa por las
   reglas de Supabase: un visitante solo puede crear pedidos web, dejar reseñas (sin publicar)
   y suscribirse. */

import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico } from "@/lib/supabase/servidor";

export type EstadoPublico = { ok?: string; error?: string } | undefined;

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "").trim();

/* Se llama al tocar "Enviar pedido por WhatsApp". Si falla, el pedido igual sale por WhatsApp. */
export async function registrarPedidoWeb(codigo: string, items: { id: string; cantidad: number }[], nombre: string) {
  if (!supabaseConfigurado || !/^AA-[A-Z0-9]{5}$/.test(codigo)) return;
  const { error } = await clientePublico().rpc("crear_pedido_web", {
    p_codigo: codigo,
    p_items: items.slice(0, 50),
    p_nombre: nombre.slice(0, 80),
  });
  if (error) console.error("No se pudo guardar el pedido web:", error.message);
}

export async function dejarResena(_: EstadoPublico, datos: FormData): Promise<EstadoPublico> {
  // Campo trampa: invisible para las personas, los robots lo llenan.
  if (texto(datos, "sitio")) return { ok: "¡Gracias!" };
  if (!supabaseConfigurado) return { error: "Las reseñas todavía no están activas." };

  const puntaje = Number(texto(datos, "puntaje"));
  const nombre = texto(datos, "nombre");
  const comentario = texto(datos, "texto");
  if (!nombre) return { error: "Contanos tu nombre." };
  if (!(puntaje >= 1 && puntaje <= 5)) return { error: "Elegí de 1 a 5 estrellas." };
  if (comentario.length < 3) return { error: "Escribí algo cortito sobre el producto." };

  const { error } = await clientePublico()
    .from("resenas")
    .insert({ producto_id: texto(datos, "producto"), nombre: nombre.slice(0, 60), texto: comentario.slice(0, 1000), puntaje });
  if (error) return { error: "No pudimos guardarla. Probá de nuevo en un rato." };
  return { ok: "¡Gracias! La vamos a publicar después de leerla." };
}

export async function suscribirse(_: EstadoPublico, datos: FormData): Promise<EstadoPublico> {
  if (texto(datos, "sitio")) return { ok: "¡Listo!" };
  if (!supabaseConfigurado) return { error: "La lista todavía no está activa." };

  const email = texto(datos, "email").toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Ese mail no parece completo." };

  const { error } = await clientePublico().from("suscriptores").insert({ email });
  // 23505: ya estaba anotado. Para quien se suscribe da lo mismo.
  if (error && error.code !== "23505") return { error: "No pudimos anotarte. Probá de nuevo en un rato." };
  return { ok: "¡Listo! Te avisamos cuando salga algo nuevo." };
}
