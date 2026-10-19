"use server";

import { randomInt } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";
import { TAGS } from "@/lib/catalogo";
import { enviarAvisoEnvio, enviarConfirmacion, enviarDescargables, type ResultadoMail } from "@/lib/mails";
import { mailsDePago } from "@/lib/mercadopago";
import { CONFIRMADOS, ESTADOS, type EstadoPedido } from "@/lib/pedidos";
import type { Estado } from "../acciones";

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "").trim();
const estadoValido = (valor: string) => ESTADOS.some(([e]) => e === valor);

/* Las ventas cargadas a mano llevan V- y las de la web AA-, así se distinguen de un vistazo. */
function codigoVenta() {
  const letras = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return "V-" + Array.from({ length: 5 }, () => letras[randomInt(letras.length)]).join("");
}

type ItemVenta = { id: string | null; nombre: string; precio: number; cantidad: number };

export async function registrarVenta(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();

  let items: ItemVenta[];
  try {
    items = JSON.parse(texto(datos, "items"));
  } catch {
    return { error: "No se entendió la lista de productos. Recargá la página y probá de nuevo." };
  }
  items = items.filter((i) => i.cantidad > 0 && (i.id || i.nombre.trim()));
  if (items.length === 0) return { error: "Sumá al menos un producto a la venta." };
  if (items.some((i) => !Number.isFinite(i.precio) || i.precio < 0)) return { error: "Revisá los precios: hay uno vacío o negativo." };

  const estado = texto(datos, "estado");
  if (!estadoValido(estado)) return { error: "Elegí el estado de la venta." };

  const codigo = codigoVenta();
  const { error } = await supabase.rpc("registrar_venta", {
    p_codigo: codigo,
    p_items: items,
    p_estado: estado,
    p_fecha: texto(datos, "fecha") || null,
    p_nombre: texto(datos, "cliente_nombre"),
    p_contacto: texto(datos, "cliente_contacto"),
    p_medio_pago: texto(datos, "medio_pago"),
    p_notas: texto(datos, "notas"),
  });
  if (error) return { error: `No se pudo guardar la venta: ${error.message}` };

  updateTag(TAGS.catalogo); // puede haber cambiado el stock
  redirect(`/admin/pedidos?listo=${codigo}`);
}

export async function cambiarEstado(datos: FormData) {
  const { supabase } = await exigirAdmin();
  const estado = texto(datos, "estado");
  if (!estadoValido(estado)) return;

  const id = Number(texto(datos, "id"));
  await supabase.rpc("cambiar_estado_pedido", { p_pedido: id, p_estado: estado });
  // Los mails al cliente que tocan con este estado (cada uno sale una sola vez):
  // pagado → confirmación y PDF de los descargables; enviado → "en camino" o "listo para retirar".
  const { data } = await supabase.from("pedidos").select("codigo").eq("id", id).maybeSingle();
  if (data) {
    if (CONFIRMADOS.includes(estado as EstadoPedido)) await mailsDePago(data.codigo, { avisarATienda: false });
    if (estado === "enviado") await enviarAvisoEnvio(data.codigo).catch((e) => console.error(`No se pudo mandar el aviso de envío de ${data.codigo}:`, e));
  }
  updateTag(TAGS.catalogo);
  refresh();
}

export async function guardarDatosPedido(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const vacioANull = (campo: string) => texto(datos, campo) || null;

  const { error } = await supabase
    .from("pedidos")
    .update({
      cliente_nombre: vacioANull("cliente_nombre"),
      cliente_contacto: vacioANull("cliente_contacto"),
      medio_pago: vacioANull("medio_pago"),
      notas: vacioANull("notas"),
      // Los campos de supabase/04-pagos-online.sql llegan solo si la base ya los tiene.
      ...(datos.has("seguimiento") && {
        cliente_email: vacioANull("cliente_email")?.toLowerCase() ?? null,
        entrega: ["retiro", "envio", "digital"].includes(texto(datos, "entrega")) ? texto(datos, "entrega") : null,
        direccion: vacioANull("direccion"),
        seguimiento: vacioANull("seguimiento"),
      }),
      ...(texto(datos, "fecha") && { fecha: texto(datos, "fecha") }),
    })
    .eq("id", Number(texto(datos, "id")));
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  refresh();
  return { ok: "Guardado." };
}

/* Botones del panel: mandan (o reenvían) un mail al cliente. */
export type TipoMail = "descargables" | "confirmacion" | "envio";
const MANDAR: Record<TipoMail, (codigo: string, opciones: { reenviar: boolean }) => Promise<ResultadoMail>> = {
  descargables: enviarDescargables,
  confirmacion: enviarConfirmacion,
  envio: enviarAvisoEnvio,
};
const MENSAJES_MAIL: Record<ResultadoMail, Estado> = {
  enviado: { ok: "¡Listo! Le mandamos el mail." },
  "ya-enviado": { ok: "Ya se lo habíamos mandado." },
  "no-corresponde": { error: "Este mail no va para este pedido (por ejemplo, el de envío en un pedido sin enviar, o solo de descargables)." },
  "sin-descargables": { error: "Este pedido no lleva descargables con PDF cargado." },
  "sin-mail": { error: "Falta el mail del cliente: cargalo en Cliente y pago, guardá y probá de nuevo." },
  "no-pagado": { error: "Primero pasá el pedido a Pagado." },
  "sin-configurar": { error: "El envío de mails no está configurado (ver supabase/LEEME.md)." },
};

export async function mandarMail(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const tipo = texto(datos, "tipo") as TipoMail;
  if (!(tipo in MANDAR)) return { error: "Mail no válido." };
  const { data } = await supabase.from("pedidos").select("codigo").eq("id", Number(texto(datos, "id"))).maybeSingle();
  if (!data) return { error: "No encontramos el pedido." };
  try {
    const resultado = MENSAJES_MAIL[await MANDAR[tipo](data.codigo, { reenviar: true })];
    refresh();
    return resultado;
  } catch (e) {
    console.error("No se pudo mandar el mail:", e);
    return { error: "Gmail no dejó mandar el mail. Revisá la configuración y probá de nuevo." };
  }
}

export async function borrarPedido(datos: FormData) {
  const { supabase } = await exigirAdmin();
  await supabase.rpc("borrar_pedido", { p_pedido: Number(texto(datos, "id")) });
  updateTag(TAGS.catalogo);
  redirect("/admin/pedidos");
}
