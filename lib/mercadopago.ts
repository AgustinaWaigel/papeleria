import "server-only";

import { supabaseConfigurado } from "./supabase/config";
import { clienteServicio, SUPABASE_SECRETA } from "./supabase/servidor";
import { avisarVenta, enviarConfirmacion, enviarDescargables } from "./mails";
import { linkDeSeguimiento } from "./seguimiento";
import { SITIO_URL } from "./sitio";

/* Cobro online con Mercado Pago (Checkout Pro): la tienda arma el pedido, Mercado Pago cobra en su
   página y después avisa. Las credenciales van en .env.local (ver .env.example). Sin ellas, la bolsita
   ofrece solo WhatsApp. */

const TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
const API = "https://api.mercadopago.com";

export const pagoOnlineConfigurado = Boolean(supabaseConfigurado && TOKEN && SUPABASE_SECRETA);

async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(API + ruta, {
    ...opciones,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...opciones.headers },
    cache: "no-store",
  });
  if (!respuesta.ok) throw new Error(`Mercado Pago respondió ${respuesta.status}: ${await respuesta.text()}`);
  return respuesta.json() as Promise<T>;
}

type ItemCobro = { id: string | null; nombre: string; precio: number; cantidad: number };
type PedidoCobro = { codigo: string; clave: string; items: ItemCobro[]; descuento?: number; costo_envio?: number; cupon?: string | null };

/* Lo que se cobra, renglón por renglón. Mercado Pago no acepta renglones negativos: con un cupón,
   los productos van juntos en uno solo, ya con el descuento hecho. */
function renglones(p: PedidoCobro) {
  const productos = p.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const descuento = p.descuento ?? 0;
  const lista =
    descuento > 0
      ? [
          {
            id: p.codigo,
            title: `Pedido ${p.codigo}: ${p.items.map((i) => (i.cantidad > 1 ? `${i.cantidad} × ${i.nombre}` : i.nombre)).join(", ")}${p.cupon ? ` (cupón ${p.cupon})` : ""}`.slice(0, 250),
            quantity: 1,
            unit_price: productos - descuento,
          },
        ]
      : p.items.map((i) => ({ id: i.id ?? undefined, title: i.nombre, quantity: i.cantidad, unit_price: i.precio }));
  if ((p.costo_envio ?? 0) > 0) lista.push({ id: "envio", title: "Envío a domicilio", quantity: 1, unit_price: p.costo_envio! });
  return lista.filter((r) => r.unit_price > 0).map((r) => ({ ...r, currency_id: "ARS" }));
}

/* Crea el link de pago. Vuelve al seguimiento del pedido cuando termina, salga bien o mal. */
export async function crearLinkDePago(pedido: PedidoCobro, comprador: { nombre?: string }) {
  const vuelta = linkDeSeguimiento(pedido.codigo, pedido.clave);
  // Mercado Pago solo puede avisar y volver solo a una dirección pública con https (no a localhost).
  const publico = SITIO_URL.startsWith("https://");

  const preferencia = await api<{ id: string; init_point: string }>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      external_reference: pedido.codigo,
      items: renglones(pedido),
      // Sin el mail: si no coincide con la cuenta con la que se paga, Mercado Pago lo toma como otra
      // persona (y con credenciales de prueba frena el pago: "una de las partes es de prueba").
      ...(comprador.nombre && { payer: { name: comprador.nombre } }),
      back_urls: { success: `${vuelta}&vaciar=1`, pending: `${vuelta}&vaciar=1`, failure: vuelta },
      ...(publico && { auto_return: "approved", notification_url: `${SITIO_URL}/api/mercadopago` }),
      statement_descriptor: "ALAS DE ANGEL",
    }),
  });
  return preferencia.init_point;
}

type Pago = { id: number; status: string; transaction_amount: number; external_reference: string | null };

/* Lee un pago de la API de Mercado Pago y lo anota en el pedido. Se confía solo en lo que responde
   la API (con nuestro token), nunca en lo que diga el aviso o la dirección de vuelta. */
export async function registrarPago(pago: Pago) {
  if (!pago.external_reference) return;
  const { error } = await clienteServicio().rpc("registrar_pago_mp", {
    p_codigo: pago.external_reference,
    p_pago_id: String(pago.id),
    p_estado: pago.status,
    p_monto: pago.transaction_amount,
  });
  if (error) throw new Error(`No se pudo anotar el pago: ${error.message}`);

  // Pago aprobado: los mails (cada uno sale una sola vez, aunque el aviso llegue repetido).
  if (pago.status === "approved") await mailsDePago(pago.external_reference);
}

/* Lo que sale cuando un pedido queda pagado: a quien compró, la confirmación y los PDF; a la tienda, el aviso. */
export async function mailsDePago(codigo: string, { avisarATienda = true } = {}) {
  const intentar = (nombre: string, mandar: () => Promise<unknown>) =>
    mandar().catch((e) => console.error(`No se pudo mandar el mail (${nombre}) de ${codigo}:`, e));
  await intentar("descargables", () => enviarDescargables(codigo));
  await intentar("confirmación", () => enviarConfirmacion(codigo));
  if (avisarATienda) await intentar("aviso a la tienda", () => avisarVenta(codigo));
}

export const leerPago = (id: string) => api<Pago>(`/v1/payments/${encodeURIComponent(id)}`);

/* Busca el último pago de un pedido. Sirve cuando el aviso de Mercado Pago no llegó (o no puede llegar,
   como en localhost): la página de seguimiento lo consulta al abrirse. */
export async function sincronizarPago(codigo: string) {
  const { results } = await api<{ results: Pago[] }>(
    `/v1/payments/search?external_reference=${encodeURIComponent(codigo)}&sort=date_created&criteria=desc&limit=10`,
  );
  const pago = results.find((p) => p.status === "approved") ?? results[0];
  if (pago) await registrarPago(pago);
}

/* Si no se pudo crear el link de pago, el pedido recién creado no sirve. */
export async function descartarPedido(codigo: string) {
  await clienteServicio().rpc("descartar_pedido_online", { p_codigo: codigo });
}
