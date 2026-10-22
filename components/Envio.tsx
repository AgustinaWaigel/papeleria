"use client";

import { useEffect, useState } from "react";
import { cotizarEnvio } from "@/app/(tienda)/acciones";
import type { Renglon } from "@/lib/bolsita";
import { precio } from "@/lib/contacto";
import { costoEnvio, ENTREGAS, type AjustesEnvio, type Entrega } from "@/lib/seguimiento";
import { nombreProvincia, numeroCP, PROVINCIAS, provinciaDeCP, SOLO_CRESPO, zonaLocal, zonaPara } from "@/lib/zonas";

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

  // Un código postal con precio fijo (por ejemplo, Crespo) no le pregunta al correo.
  const local = zonaLocal(envio.zonas, cp);
  // La respuesta del correo para cada consulta (costo null: no pudo cotizar, vale la zona).
  const [cotizacion, setCotizacion] = useState<{ clave: string; costo: number | null; texto: string } | null>(null);
  const clave = `${numeroCP(cp)}|${renglones.map((r) => `${r.id}x${r.cantidad}`).join(",")}|${montoProductos}`;
  const preguntaAlCorreo = cotizaCorreo && !SOLO_CRESPO && entrega === "envio" && Boolean(numeroCP(cp)) && !local;
  useEffect(() => {
    if (!preguntaAlCorreo) return;
    let vigente = true;
    const reloj = setTimeout(async () => {
      const r = await cotizarEnvio(renglones, cp, montoProductos).catch(() => ({}) as { costo?: number; texto?: string });
      if (vigente) setCotizacion({ clave, costo: r.costo ?? null, texto: r.texto ?? "Correo Argentino" });
    }, 500);
    return () => {
      vigente = false;
      clearTimeout(reloj);
    };
    // `clave` resume el código postal, la bolsita y el monto: no hace falta repetir cada uno.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preguntaAlCorreo, clave]);
  const respuesta = preguntaAlCorreo && cotizacion?.clave === clave ? cotizacion : null;
  const delCorreo = respuesta && respuesta.costo !== null ? { costo: respuesta.costo, texto: respuesta.texto } : null;
  // Mientras el correo no contesta, no se muestra el precio de la zona (que puede no tenerlo).
  const cotizando = preguntaAlCorreo && destinoListo && !respuesta;

  // Con SOLO_CRESPO el envío se coordina por WhatsApp: no tiene precio en la bolsita ni se paga online.
  const porWhatsApp = SOLO_CRESPO && entrega === "envio";
  const costo =
    entrega !== "envio"
      ? 0
      : porWhatsApp
        ? null
        : delCorreo
          ? delCorreo.costo
          : destinoListo && !cotizando
            ? costoEnvio(envio, montoProductos, provincia, cp)
            : undefined;

  const texto =
    entrega !== "envio"
      ? ENTREGAS.find(([e]) => e === entrega)?.[2]
      : porWhatsApp
        ? "Por ahora los envíos son solo dentro de Crespo y se coordinan por WhatsApp: mandanos el pedido y te pasamos el costo."
        : !destinoListo
          ? "Poné tu código postal y te decimos cuánto sale."
          : cotizando
            ? "Calculando el envío con Correo Argentino…"
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

  // Para mostrar el precio aparte, bien grande: de dónde sale, sin repetir el monto.
  const detalle = cotizando
    ? "Consultando a Correo Argentino…"
    : [
        delCorreo ? delCorreo.texto : zona ? `Envío a ${zona.nombre}` : null,
        envio.gratisDesde !== null && costo ? `Gratis desde ${precio(envio.gratisDesde)}.` : null,
        envio.detalle,
      ]
        .filter(Boolean)
        .join(" · ");

  return { costo, texto, detalle, destinoListo, cotizando, porWhatsApp, listo: entrega !== "envio" || destinoListo };
}

/* Cómo se nombra el destino en el resumen y en el mensaje de WhatsApp. */
export const textoDestino = (cp: string, provincia: string) =>
  SOLO_CRESPO ? "Envío a domicilio en Crespo" : `Envío a CP ${cp} (${nombreProvincia(provincia)})`;

/* Lo que va en el renglón "Envío" de las cuentas. */
export const textoCosto = (costo: number | null | undefined, cotizando = false) =>
  cotizando ? "calculando…" : costo === undefined ? "poné tu CP" : costo === null ? "a coordinar" : costo === 0 ? "gratis" : precio(costo);

/* Retiro o envío y, si es envío, código postal (la provincia se completa sola) y provincia.
   Con SOLO_CRESPO el destino ya viene puesto (ver la bolsita) y no se pregunta. */
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
              <span>{valor === "envio" && SOLO_CRESPO ? `${nombre} (solo Crespo)` : nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {eleccion.entrega === "envio" && !SOLO_CRESPO && (
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
