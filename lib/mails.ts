import "server-only";

import nodemailer from "nodemailer";
import { CONFIRMADOS, type EstadoPedido } from "./pedidos";
import {
  mailArrepentimiento,
  mailAvisoArrepentimiento,
  mailAvisoPresupuesto,
  mailConfirmacion,
  mailDescargables,
  mailEnvio,
  mailPresupuesto,
  mailRegalo,
  mailStock,
  mailVenta,
  type DatosArrepentimiento,
  type DatosPresupuesto,
  type Mail,
  type PedidoMail,
} from "./plantillas-mail";
import { rutaProducto } from "./productos";
import { linkDeDescarga, linkDeRegalo } from "./seguimiento";
import { SITIO_URL } from "./sitio";
import { supabaseConfigurado } from "./supabase/config";
import { clienteServicio, SUPABASE_SECRETA } from "./supabase/servidor";

/* Cuándo y a quién salen los mails de la tienda (lo que dicen está en lib/plantillas-mail.ts). Salen de la
   casilla de Gmail (con una "contraseña de aplicación", ver supabase/LEEME.md), así quien compra puede
   responder ahí mismo. */

const USUARIO = process.env.GMAIL_USUARIO ?? "";
const CLAVE = process.env.GMAIL_CLAVE_APP?.replace(/\s/g, "") ?? ""; // Google la muestra en grupos de 4
// A dónde llegan los avisos para la tienda (ventas, arrepentimientos). Por defecto, la misma casilla.
const AVISOS = process.env.MAIL_AVISOS || USUARIO;

export const mailConfigurado = Boolean(supabaseConfigurado && SUPABASE_SECRETA && USUARIO && CLAVE);

export type ResultadoMail = "enviado" | "ya-enviado" | "no-corresponde" | "sin-descargables" | "sin-mail" | "no-pagado" | "sin-configurar";

type PedidoGuardado = PedidoMail & {
  estado: EstadoPedido;
  pdf_enviado_en: string | null;
  mail_confirmacion_en: string | null;
  mail_envio_en: string | null;
  mail_tienda_en: string | null;
};

type Marca = "pdf_enviado_en" | "mail_confirmacion_en" | "mail_envio_en" | "mail_tienda_en";

const transporte = () =>
  nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: USUARIO, pass: CLAVE } });

// Sin adjuntos: la cabecera va por link y los PDF con un botón de descarga (los adjuntos suman para caer en spam,
// y en spam Gmail los bloquea).
const enviar = (to: string, mail: Mail, extra: { replyTo?: string } = {}) =>
  transporte().sendMail({ from: { name: "Alas de Ángel Papelería", address: USUARIO }, to, ...mail, ...extra });

async function leerPedido(codigo: string) {
  const { data } = await clienteServicio()
    .from("pedidos")
    .select(
      "codigo, clave, estado, entrega, direccion, seguimiento, cliente_nombre, cliente_email, medio_pago, total, costo_envio, descuento, cupon, pdf_enviado_en, mail_confirmacion_en, mail_envio_en, mail_tienda_en, pedido_items(producto_id, nombre, precio_unitario, cantidad)",
    )
    .eq("codigo", codigo)
    .maybeSingle();
  return data as PedidoGuardado | null;
}

/* Los descargables del pedido (con su PDF, si lo tienen). */
async function descargablesDe(pedido: PedidoMail) {
  const ids = pedido.pedido_items.flatMap((i) => (i.producto_id ? [i.producto_id] : []));
  if (ids.length === 0) return [];
  const { data } = await clienteServicio().from("productos").select("id, nombre, archivo").in("id", ids).eq("tipo", "descargable");
  return (data ?? []) as { id: string; nombre: string; archivo: string | null }[];
}

/* Marca el mail como enviado ANTES de mandarlo (si llegan dos avisos de pago juntos, solo uno lo envía)
   y lo desmarca si falla, para poder mandarlo de nuevo desde el panel. Con `reenviar` lo manda igual. */
async function unaVez(codigo: string, marca: Marca, reenviar: boolean, mandar: () => Promise<unknown>): Promise<ResultadoMail> {
  const supabase = clienteServicio();
  if (!reenviar) {
    const { data } = await supabase.from("pedidos").update({ [marca]: new Date().toISOString() }).eq("codigo", codigo).is(marca, null).select("codigo");
    if (!data?.length) return "ya-enviado";
  }
  try {
    await mandar();
  } catch (e) {
    if (!reenviar) await supabase.from("pedidos").update({ [marca]: null }).eq("codigo", codigo);
    throw e;
  }
  if (reenviar) await supabase.from("pedidos").update({ [marca]: new Date().toISOString() }).eq("codigo", codigo);
  return "enviado";
}

// ---------- Para quien compra ----------

/* Los PDF de los descargables, adjuntos. */
export async function enviarDescargables(codigo: string, { reenviar = false } = {}): Promise<ResultadoMail> {
  if (!mailConfigurado) return "sin-configurar";
  const pedido = await leerPedido(codigo);
  if (!pedido || !CONFIRMADOS.includes(pedido.estado)) return "no-pagado";
  if (!pedido.cliente_email) return "sin-mail";
  if (pedido.pdf_enviado_en && !reenviar) return "ya-enviado";
  const archivos = (await descargablesDe(pedido)).filter((d): d is { id: string; nombre: string; archivo: string } => Boolean(d.archivo));
  if (archivos.length === 0) return "sin-descargables";

  // Cada PDF con su botón de descarga, que pasa por la tienda y no vence (ver linkDeDescarga).
  const descargas = archivos.map(({ id, nombre }) => ({ nombre, url: linkDeDescarga(pedido.codigo, pedido.clave, id) }));
  return unaVez(codigo, "pdf_enviado_en", reenviar, () => enviar(pedido.cliente_email!, mailDescargables(pedido, descargas)));
}

/* "¡Recibimos tu compra!". Si el pedido es solo de descargables no hace falta: el mail con los PDF ya es la
   confirmación. */
export async function enviarConfirmacion(codigo: string, { reenviar = false } = {}): Promise<ResultadoMail> {
  if (!mailConfigurado) return "sin-configurar";
  const pedido = await leerPedido(codigo);
  if (!pedido || !CONFIRMADOS.includes(pedido.estado)) return "no-pagado";
  if (!pedido.cliente_email) return "sin-mail";
  if (pedido.mail_confirmacion_en && !reenviar) return "ya-enviado";
  const descargables = await descargablesDe(pedido);
  const idsDigitales = new Set(descargables.map((d) => d.id));
  if (pedido.pedido_items.every((i) => i.producto_id && idsDigitales.has(i.producto_id))) return "no-corresponde";

  return unaVez(codigo, "mail_confirmacion_en", reenviar, () => enviar(pedido.cliente_email!, mailConfirmacion(pedido, descargables.length > 0)));
}

/* Cuando pasa a "enviado": en camino (con el número de seguimiento) o listo para retirar. */
export async function enviarAvisoEnvio(codigo: string, { reenviar = false } = {}): Promise<ResultadoMail> {
  if (!mailConfigurado) return "sin-configurar";
  const pedido = await leerPedido(codigo);
  if (!pedido || (pedido.estado !== "enviado" && pedido.estado !== "entregado")) return "no-corresponde";
  if (pedido.entrega === "digital") return "no-corresponde";
  if (!pedido.cliente_email) return "sin-mail";
  if (pedido.mail_envio_en && !reenviar) return "ya-enviado";

  return unaVez(codigo, "mail_envio_en", reenviar, () => enviar(pedido.cliente_email!, mailEnvio(pedido)));
}

/* "¡Volvió!": a quienes pidieron aviso cuando un producto agotado vuelve a tener stock. Devuelve a cuántos. */
export async function avisarStock(productoId: string) {
  if (!mailConfigurado) return 0;
  const supabase = clienteServicio();
  const [{ data: producto }, { data: avisos }] = await Promise.all([
    supabase.from("productos").select("id, nombre, activo, stock").eq("id", productoId).maybeSingle(),
    supabase.from("avisos_stock").select("id, email").eq("producto_id", productoId).is("avisado_en", null),
  ]);
  if (!producto?.activo || producto.stock === 0 || !avisos?.length) return 0;

  const mail = mailStock(producto.nombre, SITIO_URL + rutaProducto(producto.id));
  let enviados = 0;
  for (const aviso of avisos as { id: number; email: string }[]) {
    try {
      await enviar(aviso.email, mail);
      await supabase.from("avisos_stock").update({ avisado_en: new Date().toISOString() }).eq("id", aviso.id);
      enviados++;
    } catch (e) {
      console.error(`No se pudo avisar a ${aviso.email}:`, e);
    }
  }
  return enviados;
}

/* El comprobante del pedido de arrepentimiento, y el aviso a la tienda. */
export async function confirmarArrepentimiento(datos: DatosArrepentimiento) {
  if (!mailConfigurado) return;
  await enviar(datos.email, mailArrepentimiento(datos));
  if (AVISOS) await enviar(AVISOS, mailAvisoArrepentimiento(datos), { replyTo: datos.email });
}

/* El regalo por anotarse en las novedades (si hay uno elegido en el panel). Una sola vez por suscriptor. */
export async function enviarRegalo(email: string) {
  if (!mailConfigurado) return;
  const supabase = clienteServicio();
  const { data: ajustes } = await supabase.from("ajustes").select("regalo_producto").maybeSingle();
  if (!ajustes?.regalo_producto) return;
  const { data: producto } = await supabase.from("productos").select("nombre, archivo").eq("id", ajustes.regalo_producto).maybeSingle();
  if (!producto?.archivo) return;
  // Se marca antes de mandarlo, como los mails de los pedidos: así no sale dos veces.
  const { data: suscriptor } = await supabase
    .from("suscriptores")
    .update({ regalo_enviado_en: new Date().toISOString() })
    .eq("email", email)
    .is("regalo_enviado_en", null)
    .select("clave")
    .maybeSingle();
  if (!suscriptor) return;
  try {
    await enviar(email, mailRegalo(producto.nombre, linkDeRegalo(email, suscriptor.clave)));
  } catch (e) {
    await supabase.from("suscriptores").update({ regalo_enviado_en: null }).eq("email", email);
    throw e;
  }
}

/* Pedido por mayor: la confirmación para quien lo pidió y el aviso para la tienda. */
export async function confirmarPresupuesto(datos: DatosPresupuesto, tipo: string) {
  if (!mailConfigurado) return;
  await enviar(datos.email, mailPresupuesto(datos));
  if (AVISOS) await enviar(AVISOS, mailAvisoPresupuesto(datos, tipo), { replyTo: datos.email });
}

// ---------- Para la tienda ----------

/* "Nueva venta": una sola vez por pedido. */
export async function avisarVenta(codigo: string) {
  if (!mailConfigurado || !AVISOS) return;
  const pedido = await leerPedido(codigo);
  if (!pedido || !CONFIRMADOS.includes(pedido.estado) || pedido.mail_tienda_en) return;
  await unaVez(codigo, "mail_tienda_en", false, () => enviar(AVISOS, mailVenta(pedido), { replyTo: pedido.cliente_email ?? undefined }));
}
