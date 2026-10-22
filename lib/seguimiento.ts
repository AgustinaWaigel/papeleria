/* Lo que ve quien compró en la página de seguimiento (lo devuelve ver_pedido en supabase/04-pagos-online.sql). */

import type { EstadoPedido } from "./pedidos";
import { SITIO_URL } from "./sitio";
import { zonaPara, type Zona } from "./zonas";

/* La página donde quien compró ve su pedido. La clave es lo que la hace privada. */
export const linkDeSeguimiento = (codigo: string, clave: string) => `${SITIO_URL}/pedido/${codigo}?clave=${clave}`;

/* El botón "Descargar PDF" de un descargable del pedido (ver app/(tienda)/pedido/[codigo]/pdf/[producto]/route.ts). */
export const linkDeDescarga = (codigo: string, clave: string, producto: string) =>
  `${SITIO_URL}/pedido/${codigo}/pdf/${encodeURIComponent(producto)}?clave=${clave}`;

/* El costo de envío a domicilio. Sin costo cargado (o sin supabase/07-envios-cupones-y-mas.sql), el envío
   se coordina por WhatsApp y se paga aparte. */
// costo: el costo por defecto, para las zonas sin precio propio. zonas: por código postal y provincia (lib/zonas.ts).
export type AjustesEnvio = { costo: number | null; gratisDesde: number | null; detalle: string | null; zonas: Zona[] };

/* Cuánto sale el envío a ese destino para un subtotal (null: se coordina aparte). */
export function costoEnvio(ajustes: AjustesEnvio, subtotal: number, provincia: string | null, cp: string) {
  const costo = zonaPara(ajustes.zonas, provincia, cp)?.costo ?? ajustes.costo;
  if (costo === null) return null;
  return ajustes.gratisDesde !== null && subtotal >= ajustes.gratisDesde ? 0 : costo;
}

export type Entrega = "retiro" | "envio" | "digital";

export type PedidoCliente = {
  codigo: string;
  estado: EstadoPedido;
  fecha: string;
  total: number;
  cliente_nombre: string | null;
  entrega: Entrega | null;
  direccion: string | null;
  seguimiento: string | null;
  medio_pago: string | null;
  pago_estado: string | null;
  // Desde supabase/07-envios-cupones-y-mas.sql (antes, vienen vacíos).
  costo_envio?: number;
  descuento?: number;
  cupon?: string | null;
  items: { id: string | null; nombre: string; precio: number; cantidad: number }[];
};

export const ENTREGAS: [Entrega, string, string][] = [
  ["retiro", "Lo retiro", "Coordinamos por WhatsApp dónde y cuándo."],
  ["envio", "Envío a domicilio", "El costo del envío se coordina por WhatsApp y se paga aparte."],
  ["digital", "Solo descargables", "Te mandamos los PDF por mail apenas se acredita el pago."],
];

export const nombreEntrega = (entrega: Entrega | null) => ENTREGAS.find(([e]) => e === entrega)?.[1] ?? "A coordinar";

/* Los pasos que se muestran, según cómo lo recibe. El último cambia de nombre si lo retira. */
export function pasos(entrega: Entrega | null): [EstadoPedido, string][] {
  // Con solo descargables, pagado ya es listo: los PDF salen por mail en ese momento.
  if (entrega === "digital") return [["nuevo", "Recibido"], ["pagado", "Enviado a tu mail"]];
  return [
    ["nuevo", "Recibido"],
    ["pagado", "Pagado"],
    ["enviado", entrega === "retiro" ? "Listo para retirar" : "En camino"],
    ["entregado", "Entregado"],
  ];
}

/* Cómo va el pago con Mercado Pago, en palabras. */
export function textoPago(pago: string | null): { tono: "bien" | "espera" | "mal"; texto: string } | null {
  switch (pago) {
    case "approved":
      return { tono: "bien", texto: "¡Pago aprobado! Ya estamos con tu pedido." };
    case "pending":
    case "in_process":
    case "authorized":
      return { tono: "espera", texto: "Mercado Pago está procesando el pago. Apenas se acredite, esta página se actualiza." };
    case "rejected":
    case "cancelled":
      return { tono: "mal", texto: "El pago no salió. Podés intentarlo de nuevo con otro medio." };
    case "refunded":
    case "charged_back":
      return { tono: "mal", texto: "El pago fue devuelto." };
    case "pendiente":
      return { tono: "espera", texto: "Todavía no recibimos el pago." };
    default:
      return null;
  }
}
