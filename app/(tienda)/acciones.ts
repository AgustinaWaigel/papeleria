"use server";

/* Lo que la tienda le pide al servidor sin que haya nadie logueado. Todo pasa por las
   reglas de Supabase: un visitante solo puede crear pedidos web, dejar reseñas (sin publicar)
   y suscribirse. Marcar un pedido como pagado lo hace solo Mercado Pago (ver lib/mercadopago.ts). */

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import type { PedidoCliente } from "@/lib/seguimiento";
import { nombreProvincia, numeroCP } from "@/lib/zonas";
import { obtenerAjustesEnvio } from "@/lib/catalogo";
import { armarPaquete, correoConfigurado, cotizar } from "@/lib/correo";
import { confirmarArrepentimiento } from "@/lib/mails";
import { crearLinkDePago, descartarPedido, pagoOnlineConfigurado } from "@/lib/mercadopago";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico, clienteServicio } from "@/lib/supabase/servidor";

const LETRAS_CODIGO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // las mismas que nuevoCodigo() de lib/bolsita.ts

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

export type DatosCompra = {
  nombre: string;
  email: string;
  telefono: string;
  entrega: string;
  direccion: string;
  codigoPostal?: string;
  provincia?: string;
  cupon?: string;
};
export type ResultadoPago = { url?: string; error?: string };

/* "Pagar con Mercado Pago": guarda el pedido con los datos de quien compra y devuelve el link de pago. */
export async function pagarOnline(items: { id: string; cantidad: number }[], datos: DatosCompra): Promise<ResultadoPago> {
  if (!pagoOnlineConfigurado) return { error: "El pago online todavía no está activo. Mandanos el pedido por WhatsApp." };

  const nombre = datos.nombre.trim();
  const email = datos.email.trim().toLowerCase();
  const telefono = datos.telefono.trim();
  const direccion = datos.direccion.trim();
  if (!nombre) return { error: "Contanos tu nombre." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Revisá el mail: ahí te llega el link para seguir tu pedido." };
  if (telefono.replace(/\D/g, "").length < 8) return { error: "Dejanos un teléfono con WhatsApp, por si hay que coordinar algo." };
  if (!["retiro", "envio", "digital"].includes(datos.entrega)) return { error: "Elegí cómo lo recibís." };
  if (datos.entrega === "envio" && direccion.length < 6) return { error: "Falta la dirección de envío." };
  const codigoPostal = (datos.codigoPostal ?? "").trim().toUpperCase();
  const provincia = nombreProvincia(datos.provincia ?? null) ? datos.provincia! : null;
  if (datos.entrega === "envio" && !numeroCP(codigoPostal)) return { error: "Revisá el código postal: son 4 números (o el nuevo, tipo E3100ABC)." };
  if (datos.entrega === "envio" && !provincia) return { error: "Elegí la provincia." };

  const codigo = "AA-" + Array.from({ length: 5 }, () => LETRAS_CODIGO[randomInt(LETRAS_CODIGO.length)]).join("");
  const { data: pedido, error } = await clientePublico().rpc("crear_pedido_online", {
    p_codigo: codigo,
    p_items: items.slice(0, 50).map((i) => ({ id: i.id, cantidad: Math.max(1, Math.floor(i.cantidad)) })),
    p_nombre: nombre,
    p_email: email,
    p_telefono: telefono,
    p_entrega: datos.entrega,
    // La dirección completa, para que el panel, los mails y el seguimiento la muestren entera.
    p_direccion: datos.entrega === "envio" ? `${direccion} · CP ${codigoPostal} · ${nombreProvincia(provincia)}` : "",
    ...(datos.entrega === "envio" && { p_codigo_postal: codigoPostal, p_provincia: provincia }),
    // Solo si hay cupón: así, sin supabase/07-envios-cupones-y-mas.sql, la compra sin cupón sigue andando.
    ...(datos.cupon?.trim() && { p_cupon: datos.cupon.trim() }),
  });
  if (error) {
    const sinStock = error.message.match(/sin stock: (.+)/);
    if (sinStock) return { error: `No nos quedan suficientes de ${sinStock[1]}. Bajá la cantidad o sacalo de la bolsita.` };
    const cupon = error.message.match(/cupón: (.+)/);
    if (cupon) return { error: cupon[1] };
    console.error("No se pudo crear el pedido online:", error.message);
    return { error: "No pudimos armar el pedido. Probá de nuevo o mandalo por WhatsApp." };
  }
  if (!pedido || pedido.total <= 0) return { error: "Tu bolsita quedó vacía: puede que algún producto ya no esté." };

  // Con Correo Argentino conectado, el envío sale de su cotización (calculada acá, no la que mandó el navegador).
  // Si el correo no responde, queda el de la zona que ya calculó la base.
  if (datos.entrega === "envio" && correoConfigurado) {
    const costo = await costoCorreo(items, codigoPostal, pedido.subtotal - pedido.descuento);
    if (costo !== null) {
      const { data: fijado } = await clienteServicio().rpc("fijar_costo_envio", { p_codigo: codigo, p_costo: costo });
      if (fijado) Object.assign(pedido, fijado);
    }
  }

  try {
    return { url: await crearLinkDePago(pedido, { nombre }) };
  } catch (e) {
    console.error("No se pudo crear el link de Mercado Pago:", e);
    await descartarPedido(codigo).catch(() => {});
    return { error: "Mercado Pago no respondió. Probá de nuevo en un rato o mandá el pedido por WhatsApp." };
  }
}

/* Desde el seguimiento, cuando el pago fue rechazado: un link nuevo para el mismo pedido. */
export async function reintentarPago(datos: FormData) {
  const codigo = texto(datos, "codigo");
  const clave = texto(datos, "clave");
  const { data: pedido } = await clientePublico().rpc("ver_pedido", { p_codigo: codigo, p_clave: clave });
  const p = pedido as PedidoCliente | null;
  if (!p || !pagoOnlineConfigurado || p.estado !== "nuevo" || p.pago_estado === "approved") redirect(`/pedido/${codigo}?clave=${clave}`);
  redirect(
    await crearLinkDePago(
      { codigo, clave, items: p.items, descuento: p.descuento, costo_envio: p.costo_envio, cupon: p.cupon },
      { nombre: p.cliente_nombre ?? undefined },
    ),
  );
}

/* El envío con Correo Argentino para lo que hay en la bolsita: la cotización más el recargo, o gratis si la
   compra llega al mínimo. null: no se pudo cotizar (se usa la zona). */
async function costoCorreo(items: { id: string; cantidad: number }[], cp: string, montoProductos: number) {
  try {
    const [cotizacion, ajustes] = await Promise.all([cotizar(cp, await armarPaquete(items.slice(0, 50))), obtenerAjustesEnvio()]);
    if (!cotizacion) return null;
    return ajustes.gratisDesde !== null && montoProductos >= ajustes.gratisDesde ? 0 : cotizacion.costo;
  } catch (e) {
    console.error("No se pudo cotizar con Correo Argentino:", e);
    return null;
  }
}

/* Desde la bolsita, a medida que se escribe el código postal: lo que sale el envío con Correo Argentino. */
export async function cotizarEnvio(
  items: { id: string; cantidad: number }[],
  cp: string,
  montoProductos: number,
): Promise<{ costo?: number; texto?: string }> {
  if (!correoConfigurado || !numeroCP(cp)) return {};
  const costo = await costoCorreo(items, cp, montoProductos);
  if (costo === null) return {};
  // Para el texto, la cotización ya quedó guardada en memoria: no vuelve a preguntarle al correo.
  const c = await cotizar(cp, await armarPaquete(items.slice(0, 50))).catch(() => null);
  const dias = c?.diasMin && c?.diasMax ? ` · llega en ${c.diasMin} a ${c.diasMax} días hábiles` : "";
  return { costo, texto: `${c?.servicio ?? "Correo Argentino"} a domicilio${dias}` };
}

/* "¿Tenés un cupón?": cuánto descuenta sobre lo que hay en la bolsita (los precios salen de la base). */
export async function validarCupon(codigo: string, items: { id: string; cantidad: number }[]): Promise<{ codigo?: string; descuento?: number; texto?: string; error?: string }> {
  if (!supabaseConfigurado || !codigo.trim()) return { error: "Escribí el código del cupón." };
  const { data, error } = await clientePublico().rpc("validar_cupon", {
    p_codigo: codigo.trim().slice(0, 30),
    p_items: items.slice(0, 50).map((i) => ({ id: i.id, cantidad: Math.max(1, Math.floor(i.cantidad)) })),
  });
  if (error || !data) return { error: "No pudimos revisar el cupón. Probá de nuevo." };
  return data;
}

/* "Avisame cuando vuelva", en un producto agotado. */
export async function avisarmeStock(_: EstadoPublico, datos: FormData): Promise<EstadoPublico> {
  if (texto(datos, "sitio")) return { ok: "¡Listo!" };
  if (!supabaseConfigurado) return { error: "Los avisos todavía no están activos." };
  const email = texto(datos, "email").toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Ese mail no parece completo." };

  const { error } = await clientePublico().from("avisos_stock").insert({ producto_id: texto(datos, "producto"), email });
  // 23505: ya lo había pedido. Para quien lo pide da lo mismo.
  if (error && error.code !== "23505") return { error: "No pudimos anotarte. Probá de nuevo en un rato." };
  return { ok: "¡Listo! Te escribimos apenas vuelva." };
}

/* Botón de arrepentimiento (Res. 424/2020): registra el pedido y devuelve el código de trámite al instante. */
export async function pedirArrepentimiento(_: EstadoPublico, datos: FormData): Promise<EstadoPublico & { codigo?: string }> {
  if (texto(datos, "sitio")) return { ok: "¡Listo!" };
  if (!supabaseConfigurado) return { error: "Escribinos por WhatsApp o mail para cancelar tu compra." };
  const campos = {
    nombre: texto(datos, "nombre"),
    email: texto(datos, "email").toLowerCase(),
    telefono: texto(datos, "telefono"),
    pedido: texto(datos, "pedido").toUpperCase(),
    motivo: texto(datos, "motivo"),
  };
  if (campos.nombre.length < 2) return { error: "Contanos tu nombre." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(campos.email)) return { error: "Revisá el mail: ahí te llega el comprobante." };

  const { data: codigo, error } = await clientePublico().rpc("crear_arrepentimiento", {
    p_nombre: campos.nombre,
    p_email: campos.email,
    p_telefono: campos.telefono,
    p_pedido: campos.pedido,
    p_motivo: campos.motivo,
  });
  if (error || !codigo) return { error: "No pudimos registrarlo. Escribinos por WhatsApp o mail y lo hacemos a mano." };
  await confirmarArrepentimiento({ codigo, ...campos }).catch((e) => console.error("No se pudo mandar el mail de arrepentimiento:", e));
  return { ok: "Registramos tu pedido de arrepentimiento.", codigo };
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
