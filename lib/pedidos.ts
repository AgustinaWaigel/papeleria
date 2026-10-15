/* Pedidos y ventas: tipos y textos compartidos por el panel. */

export type EstadoPedido = "nuevo" | "pagado" | "enviado" | "entregado" | "cancelado";

export const ESTADOS: [EstadoPedido, string][] = [
  ["nuevo", "Sin confirmar"],
  ["pagado", "Pagado"],
  ["enviado", "Enviado"],
  ["entregado", "Entregado"],
  ["cancelado", "Cancelado"],
];

/* Estos cuentan como venta hecha: suman a la caja y descuentan stock. */
export const CONFIRMADOS: EstadoPedido[] = ["pagado", "enviado", "entregado"];

export const MEDIOS_PAGO = ["Efectivo", "Transferencia", "Mercado Pago", "Tarjeta", "Otro"];

export type ItemPedido = {
  id: number;
  producto_id: string | null;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
};

export type Pedido = {
  id: number;
  codigo: string;
  origen: "web" | "manual";
  estado: EstadoPedido;
  cliente_nombre: string | null;
  cliente_contacto: string | null;
  medio_pago: string | null;
  notas: string | null;
  total: number;
  fecha: string; // AAAA-MM-DD
  creado_en: string;
  pedido_items: ItemPedido[];
};

export const nombreEstado = (estado: EstadoPedido) => ESTADOS.find(([e]) => e === estado)?.[1] ?? estado;

const ZONA = "America/Argentina/Buenos_Aires";

/* Hoy en Argentina, como AAAA-MM-DD (el formato de los <input type="date">). */
export const hoyEnArgentina = () => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());

/* "2026-10-14" → "14 de octubre". Se parsea a mano para que la zona horaria no corra el día. */
export function fechaLinda(fecha: string, conAnio = false) {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12)).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    ...(conAnio && { year: "numeric" }),
    timeZone: "UTC",
  });
}

/* "2026-10" → "octubre de 2026" */
export function mesLindo(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });
}

/* Suma o resta meses a "AAAA-MM". */
export function moverMes(mes: string, delta: number) {
  const [a, m] = mes.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
}

/* Un link de WhatsApp si el contacto parece un teléfono. */
export function whatsappDe(contacto: string | null) {
  const numero = contacto?.replace(/\D/g, "") ?? "";
  if (numero.length < 8) return null;
  // Números argentinos sin código de país: se le agrega 549.
  return `https://wa.me/${numero.length <= 11 && !numero.startsWith("54") ? "549" + numero.replace(/^0/, "") : numero}`;
}
