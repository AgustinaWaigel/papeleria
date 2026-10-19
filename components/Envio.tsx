"use client";

import { useEffect, useState } from "react";
import { cotizarEnvio } from "@/app/(tienda)/acciones";
import type { Renglon } from "@/lib/bolsita";
import { precio } from "@/lib/contacto";
import { costoEnvio, ENTREGAS, type AjustesEnvio, type Entrega } from "@/lib/seguimiento";
import { nombreProvincia, numeroCP, PROVINCIAS, provinciaDeCP, zonaPara } from "@/lib/zonas";

/* Cómo lo recibe quien compra: se elige en la bolsita, antes de pagar, y sirve tanto para pagar online
   como para mandar el pedido por WhatsApp. */
export type EleccionEnvio = { entrega: Entrega; cp: string; provincia: string };

/* Cuánto sale el envío elegido. costo: 0 (retiro o gratis), un monto, null (se coordina aparte) o
   undefined (falta el código postal). Con Correo Argentino conectado le pregunta el precio real medio
   segundo después de la última tecla; mientras tanto, o si no responde, vale el de la zona.
   Es un adelanto: al pagar, el servidor lo vuelve a calcular. */
export function useEnvio({ items, envio, cotizaCorreo, eleccion, descuento = 0 }: {
  items: Renglon[];
  envio: AjustesEnvio;
  cotizaCorreo: boolean;
  eleccion: EleccionEnvio;
  descuento?: number;
}) {
  const { entrega, cp, provincia } = eleccion;
  const renglones = items.map((r) => ({ id: r.producto.id, cantidad: r.cantidad }));
  const montoProductos = items.reduce((s, r) => s + r.producto.precio * r.cantidad, 0) - descuento;
  const destinoListo = Boolean(numeroCP(cp) && provincia);
  const zona = destinoListo ? zonaPara(envio.zonas, provincia, cp) : null;

  const [cotizacion, setCotizacion] = useState<{ clave: string; costo: number; texto: string } | null>(null);
  const clave = `${numeroCP(cp)}|${renglones.map((r) => `${r.id}x${r.cantidad}`).join(",")}|${montoProductos}`;
  useEffect(() => {
    if (!cotizaCorreo || entrega !== "envio" || !numeroCP(cp)) return;
    let vigente = true;
    const reloj = setTimeout(async () => {
      const r = await cotizarEnvio(renglones, cp, montoProductos).catch(() => ({}) as { costo?: number; texto?: string });
      if (vigente && r.costo !== undefined) setCotizacion({ clave, costo: r.costo, texto: r.texto ?? "Correo Argentino" });
    }, 500);
    return () => {
      vigente = false;
      clearTimeout(reloj);
    };
    // `clave` resume el código postal, la bolsita y el monto: no hace falta repetir cada uno.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cotizaCorreo, entrega, clave]);
  const delCorreo = cotizacion?.clave === clave ? cotizacion : null;

  const costo =
    entrega !== "envio" ? 0 : delCorreo ? delCorreo.costo : destinoListo ? costoEnvio(envio, montoProductos, provincia, cp) : undefined;

  const texto =
    entrega !== "envio"
      ? ENTREGAS.find(([e]) => e === entrega)?.[2]
      : !destinoListo
        ? "Poné tu código postal y te decimos cuánto sale."
        : [
            costo === null
              ? "El envío a tu zona se coordina por WhatsApp y se paga aparte."
              : costo === 0
                ? "¡Envío gratis!"
                : delCorreo
                  ? `${delCorreo.texto}: ${precio(delCorreo.costo)}.`
                  : `Envío a ${zona?.nombre ?? nombreProvincia(provincia)}: ${precio(costo!)}.`,
            envio.gratisDesde !== null && costo ? `Gratis desde ${precio(envio.gratisDesde)}.` : null,
            envio.detalle,
          ]
            .filter(Boolean)
            .join(" ");

  return { costo, texto, destinoListo, listo: entrega !== "envio" || destinoListo };
}

/* Lo que va en el renglón "Envío" de las cuentas. */
export const textoCosto = (costo: number | null | undefined) =>
  costo === undefined ? "poné tu CP" : costo === null ? "a coordinar" : costo === 0 ? "gratis" : precio(costo);

/* Retiro o envío y, si es envío, código postal (la provincia se completa sola) y provincia. */
export function ElegirEnvio({ eleccion, cambiar, texto }: { eleccion: EleccionEnvio; cambiar: (e: EleccionEnvio) => void; texto?: string }) {
  const opciones = ENTREGAS.filter(([e]) => e !== "digital");
  return (
    <div className="envio-elegir">
      <fieldset className="campo">
        <legend>Cómo lo recibís</legend>
        <div className="opciones">
          {opciones.map(([valor, nombre]) => (
            <label key={valor} className="opcion">
              <input type="radio" name="entrega" value={valor} checked={eleccion.entrega === valor} onChange={() => cambiar({ ...eleccion, entrega: valor })} />
              <span>{nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {eleccion.entrega === "envio" && (
        <div className="compra__par">
          <div className="campo">
            <label htmlFor="envio-cp">Código postal</label>
            <input
              type="text"
              id="envio-cp"
              autoComplete="postal-code"
              maxLength={8}
              placeholder="3100"
              value={eleccion.cp}
              onChange={(e) => {
                const cp = e.target.value.toUpperCase();
                cambiar({ ...eleccion, cp, provincia: provinciaDeCP(cp) ?? eleccion.provincia });
              }}
            />
          </div>
          <div className="campo">
            <label htmlFor="envio-provincia">Provincia</label>
            <select id="envio-provincia" value={eleccion.provincia} onChange={(e) => cambiar({ ...eleccion, provincia: e.target.value })}>
              <option value="" disabled>
                Elegí…
              </option>
              {PROVINCIAS.map(([letra, nombre]) => (
                <option key={letra} value={letra}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {texto && <p className="campo__ayuda envio-elegir__texto">{texto}</p>}
    </div>
  );
}
