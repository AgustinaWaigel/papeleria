/* La bolsita: un almacén mínimo sobre localStorage, pensado para useSyncExternalStore.
   No conoce el catálogo: los precios y nombres los pone quien la muestra, con `buscar`. */

import { precio } from "./contacto";

export type Bolsita = Record<string, number>;
export type ResumenProducto = { id: string; nombre: string; precio: number; stock?: number; tipo: string };
export type Buscar = (id: string) => ResumenProducto | undefined;

const CLAVE = "alas-bolsita";
const VACIA: Bolsita = {};
const oyentes = new Set<() => void>();
let estado: Bolsita | null = null;

function leer(): Bolsita {
  if (estado) return estado;
  try {
    const guardado: Bolsita = JSON.parse(localStorage.getItem(CLAVE) ?? "{}");
    estado = Object.fromEntries(Object.entries(guardado).filter(([, n]) => n > 0));
  } catch {
    estado = {};
  }
  return estado;
}

export function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export const foto = leer;
export const fotoServidor = () => VACIA;

export function cambiarCantidad(id: string, delta: number) {
  const siguiente = { ...leer() };
  const cantidad = (siguiente[id] ?? 0) + delta;
  if (cantidad > 0) siguiente[id] = cantidad;
  else delete siguiente[id];
  estado = siguiente;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(siguiente));
  } catch {
    /* sin almacenamiento: la bolsita dura lo que dure la pestaña */
  }
  oyentes.forEach((oyente) => oyente());
}

/* Después de pagar online la bolsita arranca de cero. */
export function vaciar() {
  estado = {};
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: no había nada guardado */
  }
  oyentes.forEach((oyente) => oyente());
}

/* Lo que hay en la bolsita y sigue en el catálogo (un producto puede haberse dado de baja). */
export const renglones = (bolsita: Bolsita, buscar: Buscar) =>
  Object.entries(bolsita).flatMap(([id, cantidad]) => {
    const producto = buscar(id);
    return producto ? [{ producto, cantidad }] : [];
  });

export type Renglon = ReturnType<typeof renglones>[number];

export const total = (lista: Renglon[]) => lista.reduce((suma, r) => suma + r.producto.precio * r.cantidad, 0);

export const unidades = (lista: Renglon[]) => lista.reduce((suma, r) => suma + r.cantidad, 0);

/* Cuánto más se puede sumar de un producto sin pasarse del stock (Infinity si no se controla). */
export const lugarLibre = (producto: ResumenProducto, cantidad: number) =>
  producto.stock === undefined ? Infinity : producto.stock - cantidad;

/* Un código corto para reconocer el pedido en WhatsApp y en el panel: "AA-7K3FQ". */
export function nuevoCodigo() {
  const letras = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin 0/O ni 1/I, que se confunden
  const azar = crypto.getRandomValues(new Uint8Array(5));
  return "AA-" + Array.from(azar, (n) => letras[n % letras.length]).join("");
}

/* Cómo lo recibe, para el mensaje. En un envío, costo null o undefined: se coordina por WhatsApp. */
export type EntregaPedido =
  | { tipo: "retiro" }
  | { tipo: "digital" }
  | { tipo: "envio"; destino?: string; costo?: number | null; direccion?: string };

/* El mensaje de WhatsApp con el pedido. Sin entrega elegida, se coordina en el chat. */
export function textoPedido(lista: Renglon[], { codigo, nombre, entrega }: { codigo?: string; nombre?: string; entrega?: EntregaPedido } = {}) {
  const subtotal = total(lista);
  const envio = entrega?.tipo === "envio" ? entrega : null;
  const costoEnvio = typeof envio?.costo === "number" ? envio.costo : null;

  const lineas = [
    nombre ? `¡Hola Alas de Ángel! Soy ${nombre} y quiero hacer este pedido:` : "¡Hola Alas de Ángel! Quiero hacer este pedido:",
    "",
    ...(codigo ? [`🛍️ Pedido ${codigo}`] : []),
    ...lista.map(({ producto: p, cantidad: n }) => `• ${n} × ${p.nombre} — ${precio(p.precio * n)}`),
    "",
  ];
  if (envio) {
    lineas.push(
      `Productos: ${precio(subtotal)}`,
      `🚚 Envío a domicilio${envio.destino ? ` (${envio.destino})` : ""}: ${costoEnvio === null ? "a coordinar" : costoEnvio === 0 ? "gratis" : precio(costoEnvio)}`,
      ...(envio.direccion?.trim() ? [`📍 Dirección: ${envio.direccion.trim()}`] : []),
    );
  } else if (entrega?.tipo === "retiro") lineas.push("📦 Lo retiro en Crespo.");
  else if (entrega?.tipo === "digital") lineas.push("📩 Son descargables: me llegan por mail.");
  else lineas.push("La entrega la coordinamos por acá.");

  lineas.push(
    `*Total: ${precio(subtotal + (costoEnvio ?? 0))}*${envio && costoEnvio === null ? " + envío" : ""}`,
    "",
    "¿Me confirman y me pasan los datos para pagar? ¡Gracias!",
  );
  return lineas.join("\n");
}
