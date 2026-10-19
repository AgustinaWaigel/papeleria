import "server-only";

import nodemailer from "nodemailer";
import { CABECERA_CID, CABECERA_PNG } from "./mail-cabecera";
import { CONFIRMADOS, type EstadoPedido } from "./pedidos";
import {
  mailArrepentimiento,
  mailAvisoArrepentimiento,
  mailConfirmacion,
  mailDescargables,
  mailEnvio,
  mailStock,
  mailVenta,
  type DatosArrepentimiento,
  type Mail,
  type PedidoMail,
} from "./plantillas-mail";
import { rutaProducto } from "./productos";
import { SITIO_URL } from "./sitio";
import { BUCKET_DESCARGABLES, supabaseConfigurado } from "./supabase/config";
import { clienteServicio, SUPABASE_SECRETA } from "./supabase/servidor";

/* Cuándo y a quién salen los mails de la tienda (lo que dicen está en lib/plantillas-mail.ts). Salen de la
   casilla de Gmail (con una "contraseña de aplicación", ver supabase/LEEME.md), así quien compra puede
   responder ahí mismo. */

const USUARIO = process.env.GMAIL_USUARIO ?? "";
const CLAVE = process.env.GMAIL_CLAVE_APP?.replace(/\s/g, "") ?? ""; // Google la muestra en grupos de 4
// A dónde llegan los avisos para la tienda (ventas, arrepentimientos). Por defecto, la misma casilla.
const AVISOS = process.env.MAIL_AVISOS || USUARIO;

export const mailConfigurado = Boolean(supabaseConfigurado && SUPABASE_SECRETA && USUARIO && CLAVE);

// Gmail rechaza mails de más de 25 MB, y los adjuntos crecen un tercio al codificarse.
// Lo que no entra va como link dentro del mismo mail.
const LIMITE_ADJUNTOS = 17 * 1024 * 1024;
const DURACION_LINK = 7 * 24 * 60 * 60; // segundos

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

type Adjunto = { filename: string; content: Buffer };
// La cabecera viaja adentro de cada mail (la plantilla la muestra con "cid:").
const cabecera = { filename: "alas-de-angel.png", content: Buffer.from(CABECERA_PNG, "base64"), cid: CABECERA_CID, contentDisposition: "inline" as const };
const enviar = (to: string, mail: Mail, { attachments = [], ...extra }: { replyTo?: string; attachments?: Adjunto[] } = {}) =>
  transporte().sendMail({ from: { name: "Alas de Ángel Papelería", address: USUARIO }, to, ...mail, ...extra, attachments: [cabecera, ...attachments] });

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

  return unaVez(codigo, "pdf_enviado_en", reenviar, async () => {
    const supabase = clienteServicio();
    const adjuntos: Adjunto[] = [];
    const links: { nombre: string; url: string }[] = [];
    let peso = 0;
    for (const { nombre, archivo } of archivos) {
      const nombreArchivo = `${nombre} - Alas de Angel.${archivo.split(".").pop() ?? "pdf"}`;
      const { data: blob, error } = await supabase.storage.from(BUCKET_DESCARGABLES).download(archivo);
      if (error || !blob) throw new Error(`No se pudo leer ${archivo}: ${error?.message}`);
      if (peso + blob.size <= LIMITE_ADJUNTOS) {
        adjuntos.push({ filename: nombreArchivo, content: Buffer.from(await blob.arrayBuffer()) });
        peso += blob.size;
      } else {
        const { data: firmado } = await supabase.storage.from(BUCKET_DESCARGABLES).createSignedUrl(archivo, DURACION_LINK, { download: nombreArchivo });
        if (!firmado) throw new Error(`No se pudo armar el link de ${archivo}`);
        links.push({ nombre, url: firmado.signedUrl });
      }
    }
    await enviar(pedido.cliente_email!, mailDescargables(pedido, adjuntos.map((a) => a.filename), links), { attachments: adjuntos });
  });
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

// ---------- Para la tienda ----------

/* "Nueva venta": una sola vez por pedido. */
export async function avisarVenta(codigo: string) {
  if (!mailConfigurado || !AVISOS) return;
  const pedido = await leerPedido(codigo);
  if (!pedido || !CONFIRMADOS.includes(pedido.estado) || pedido.mail_tienda_en) return;
  await unaVez(codigo, "mail_tienda_en", false, () => enviar(AVISOS, mailVenta(pedido), { replyTo: pedido.cliente_email ?? undefined }));
}
