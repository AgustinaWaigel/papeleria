import "server-only";

import { clienteServicio, SUPABASE_SECRETA } from "./supabase/servidor";
import { supabaseConfigurado } from "./supabase/config";
import { numeroCP } from "./zonas";

/* Cotización en vivo con Correo Argentino (API MiCorreo, ver el manual "Correo Argentino - API MiCorreo").
   Hacen falta dos juegos de credenciales (en .env.local y en Vercel):
   - las de la API, que da Correo Argentino a pedido (CORREO_API_USUARIO y CORREO_API_CLAVE);
   - las de tu cuenta MiCorreo (CORREO_MICORREO_EMAIL y CORREO_MICORREO_CLAVE), o directo CORREO_CUSTOMER_ID.
   Sin ellas, o si el correo no responde, el envío sale de las zonas (lib/zonas.ts). */

const AMBIENTE = process.env.CORREO_AMBIENTE === "produccion" ? "produccion" : "prueba";
const BASE = AMBIENTE === "produccion" ? "https://api.correoargentino.com.ar/micorreo/v1" : "https://apitest.correoargentino.com.ar/micorreo/v1";
const USUARIO = process.env.CORREO_API_USUARIO ?? "";
const CLAVE = process.env.CORREO_API_CLAVE ?? "";
const EMAIL = process.env.CORREO_MICORREO_EMAIL ?? "";
const CLAVE_MICORREO = process.env.CORREO_MICORREO_CLAVE ?? "";
const CUSTOMER_ID = process.env.CORREO_CUSTOMER_ID ?? "";
// Desde dónde despachás (Crespo). La API igual cotiza desde la sucursal de tu cuenta MiCorreo, pero lo pide.
export const CP_ORIGEN = process.env.CORREO_CP_ORIGEN ?? "3116";

export const correoConfigurado = Boolean(supabaseConfigurado && SUPABASE_SECRETA && USUARIO && CLAVE && (CUSTOMER_ID || (EMAIL && CLAVE_MICORREO)));
export const ambienteCorreo = AMBIENTE;

// En memoria del servidor: el token dura un rato y el número de cliente no cambia.
let token: { valor: string; vence: number } | null = null;
let customerId = CUSTOMER_ID;
const cotizaciones = new Map<string, { resultado: Cotizacion; vence: number }>();

async function pedir<T>(ruta: string, opciones: RequestInit & { conToken?: boolean } = {}): Promise<T> {
  const { conToken = true, ...resto } = opciones;
  const respuesta = await fetch(BASE + ruta, {
    ...resto,
    headers: {
      "Content-Type": "application/json",
      ...(conToken && { Authorization: `Bearer ${await obtenerToken()}` }),
      ...resto.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const texto = await respuesta.text();
  if (!respuesta.ok) throw new Error(`Correo Argentino respondió ${respuesta.status} en ${ruta}: ${texto.slice(0, 300)}`);
  return JSON.parse(texto) as T;
}

async function obtenerToken() {
  if (token && token.vence > Date.now()) return token.valor;
  const { token: valor } = await pedir<{ token: string; expires: string }>("/token", {
    method: "POST",
    conToken: false,
    headers: { Authorization: `Basic ${Buffer.from(`${USUARIO}:${CLAVE}`).toString("base64")}` },
  });
  // El manual da la fecha de vencimiento sin zona horaria: por las dudas, se renueva cada 30 minutos.
  token = { valor, vence: Date.now() + 30 * 60 * 1000 };
  return valor;
}

async function obtenerCustomerId() {
  if (customerId) return customerId;
  const { customerId: id } = await pedir<{ customerId: string }>("/users/validate", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: CLAVE_MICORREO }),
  });
  customerId = id;
  return id;
}

export type Cotizacion = { costo: number; servicio: string; diasMin: number | null; diasMax: number | null };
type Tarifa = { deliveredType: string; productType: string; productName: string; price: number; deliveryTimeMin?: string; deliveryTimeMax?: string };

/* El paquete: el peso de lo que lleva (cada producto con su peso, o el de por defecto) y la caja estándar. */
export async function armarPaquete(items: { id: string; cantidad: number }[]) {
  const supabase = clienteServicio();
  const [{ data: ajustes }, { data: productos }] = await Promise.all([
    supabase.from("ajustes").select("caja_alto, caja_ancho, caja_largo, peso_por_defecto, envio_recargo").maybeSingle(),
    supabase.from("productos").select("id, tipo, peso_gramos").in("id", items.map((i) => i.id)),
  ]);
  const caja = ajustes ?? { caja_alto: 5, caja_ancho: 20, caja_largo: 30, peso_por_defecto: 300, envio_recargo: 0 };
  const porId = new Map((productos ?? []).map((p) => [p.id, p]));
  // Los descargables no pesan.
  const peso = items.reduce((s, i) => {
    const p = porId.get(i.id);
    return p && p.tipo !== "descargable" ? s + (p.peso_gramos ?? caja.peso_por_defecto) * i.cantidad : s;
  }, 0);
  return { peso: Math.min(Math.max(Math.round(peso), 1), 50000), alto: caja.caja_alto, ancho: caja.caja_ancho, largo: caja.caja_largo, recargo: caja.envio_recargo };
}

/* Cuánto sale mandar ese paquete a domicilio a ese código postal (el servicio más barato), con el recargo. */
export async function cotizar(cpDestino: string, paquete: Awaited<ReturnType<typeof armarPaquete>>): Promise<Cotizacion | null> {
  const destino = numeroCP(cpDestino);
  if (!correoConfigurado || !destino) return null;

  const clave = `${destino}|${paquete.peso}|${paquete.alto}x${paquete.ancho}x${paquete.largo}|${paquete.recargo}`;
  const guardada = cotizaciones.get(clave);
  if (guardada && guardada.vence > Date.now()) return guardada.resultado;

  const { rates } = await pedir<{ rates: Tarifa[] }>("/rates", {
    method: "POST",
    body: JSON.stringify({
      customerId: await obtenerCustomerId(),
      postalCodeOrigin: numeroCP(CP_ORIGEN) ?? CP_ORIGEN,
      postalCodeDestination: destino,
      deliveredType: "D",
      dimensions: { weight: paquete.peso, height: paquete.alto, width: paquete.ancho, length: paquete.largo },
    }),
  });
  const tarifa = rates.filter((t) => t.deliveredType === "D" && t.price > 0).sort((a, b) => a.price - b.price)[0];
  if (!tarifa) return null;

  const resultado: Cotizacion = {
    costo: Math.ceil(tarifa.price) + paquete.recargo,
    servicio: tarifa.productName,
    diasMin: tarifa.deliveryTimeMin ? Number(tarifa.deliveryTimeMin) : null,
    diasMax: tarifa.deliveryTimeMax ? Number(tarifa.deliveryTimeMax) : null,
  };
  cotizaciones.set(clave, { resultado, vence: Date.now() + 60 * 60 * 1000 });
  return resultado;
}
