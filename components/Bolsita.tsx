"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { registrarPedidoWeb } from "@/app/(tienda)/acciones";
import {
  cambiarCantidad,
  foto,
  fotoServidor,
  lugarLibre,
  nuevoCodigo,
  renglones,
  suscribir,
  textoPedido,
  total,
  type Renglon,
  type ResumenProducto,
} from "@/lib/bolsita";
import { enlaceWhatsApp, precio } from "@/lib/contacto";
import { nombreProvincia } from "@/lib/zonas";
import type { AjustesEnvio } from "@/lib/seguimiento";
import { ElegirEnvio, textoCosto, useEnvio, type EleccionEnvio } from "./Envio";
import { FormCompra } from "./FormCompra";

type Acciones = { abrir: () => void; sumar: (id: string) => void };

const Contexto = createContext<Acciones | null>(null);
const ContextoRenglones = createContext<Renglon[]>([]);

export function useAccionesBolsita() {
  const acciones = useContext(Contexto);
  if (!acciones) throw new Error("useAccionesBolsita se usa dentro de <ProveedorBolsita>");
  return acciones;
}

/* Lo que hay en la bolsita, ya cruzado con el catálogo. */
export const useRenglones = () => useContext(ContextoRenglones);

type Props = { catalogo: ResumenProducto[]; pagoOnline: boolean; envio: AjustesEnvio; cotizaCorreo: boolean; children: React.ReactNode };

export function ProveedorBolsita({ catalogo, pagoOnline, envio, cotizaCorreo, children }: Props) {
  const bolsita = useSyncExternalStore(suscribir, foto, fotoServidor);
  const porId = useMemo(() => new Map(catalogo.map((p) => [p.id, p])), [catalogo]);
  const items = useMemo(() => renglones(bolsita, (id) => porId.get(id)), [bolsita, porId]);
  const [abierta, setAbierta] = useState(false);
  const [aviso, setAviso] = useState({ texto: "", visible: false });
  const [nombre, setNombre] = useState("");
  const [comprando, setComprando] = useState(false); // con el formulario de pago online a la vista

  // Cómo lo recibe: se elige acá, antes de pagar (si todo es descargable, no hay nada que elegir).
  const soloDigital = items.length > 0 && items.every((r) => r.producto.tipo === "descargable");
  const [eleccion, setEleccion] = useState<EleccionEnvio>({ entrega: "retiro", cp: "", provincia: "" });
  const eleccionReal: EleccionEnvio = soloDigital ? { ...eleccion, entrega: "digital" } : eleccion;
  const calculo = useEnvio({ items, envio, cotizaCorreo, eleccion: eleccionReal });
  // Lo que dice el mensaje de WhatsApp sobre la entrega.
  const envioWhatsApp = soloDigital
    ? undefined
    : eleccion.entrega === "retiro"
      ? { texto: "Lo retiro.", costo: 0 }
      : calculo.destinoListo
        ? {
            texto: `Envío a CP ${eleccion.cp} (${nombreProvincia(eleccion.provincia)}): ${textoCosto(calculo.costo)}.`,
            costo: calculo.costo ?? 0,
          }
        : { texto: "Con envío a domicilio (a coordinar).", costo: 0 };
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!abierta) return;
    panel.current?.focus();
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(false);
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierta]);

  const acciones: Acciones = {
    abrir: () => setAbierta(true),
    sumar: (id) => {
      const producto = porId.get(id);
      if (!producto) return;
      const libre = lugarLibre(producto, bolsita[id] ?? 0);
      if (libre > 0) cambiarCantidad(id, 1);
      setAviso({
        texto: libre > 0 ? `${producto.nombre} ya está en tu bolsita` : `No nos quedan más de ${producto.nombre} por ahora`,
        visible: true,
      });
      clearTimeout(reloj.current);
      reloj.current = setTimeout(() => setAviso((a) => ({ ...a, visible: false })), 2400);
    },
  };

  const cerrar = () => setAbierta(false);

  return (
    <Contexto value={acciones}>
      <ContextoRenglones value={items}>
        {children}

        <div className={abierta ? "bolsita-abierta" : undefined}>
          <div className="velo" onClick={cerrar} />
          <aside className="bolsita" aria-label="Tu bolsita" tabIndex={-1} ref={panel}>
            <div className="bolsita__cabeza">
              <h2>Tu bolsita</h2>
              <button className="boton boton--claro boton--chico" type="button" onClick={cerrar}>
                Cerrar
              </button>
            </div>

            <ul className="bolsita__lista">
              {items.length === 0 && (
                <li className="bolsita__vacia">
                  <span className="nota-mano">todavía vacía</span>
                  Sumá algo desde{" "}
                  <Link href="/papeleria" onClick={cerrar}>
                    la papelería
                  </Link>{" "}
                  o{" "}
                  <Link href="/descargables" onClick={cerrar}>
                    los descargables
                  </Link>
                  .
                </li>
              )}
              {items.map(({ producto: p, cantidad }) => (
                <li className="bolsita__item" key={p.id}>
                  <strong>{p.nombre}</strong>
                  <span>{precio(p.precio * cantidad)}</span>
                  <div className="bolsita__cantidad">
                    <button type="button" aria-label={`Quitar uno de ${p.nombre}`} onClick={() => cambiarCantidad(p.id, -1)}>
                      −
                    </button>
                    <span className="bolsita__numero" key={cantidad}>
                      {cantidad}
                    </span>
                    <button
                      type="button"
                      aria-label={`Sumar uno de ${p.nombre}`}
                      disabled={lugarLibre(p, cantidad) <= 0}
                      onClick={() => cambiarCantidad(p.id, 1)}
                    >
                      +
                    </button>
                  </div>
                  <button className="bolsita__quitar" type="button" onClick={() => cambiarCantidad(p.id, -cantidad)}>
                    Sacar
                  </button>
                </li>
              ))}
            </ul>

            {items.length > 0 && (
              <div className="bolsita__pie">
                {comprando ? (
                  <FormCompra items={items} envio={envio} cotizaCorreo={cotizaCorreo} eleccion={eleccionReal} volver={() => setComprando(false)} />
                ) : (
                  <>
                    {/* Primero cómo lo recibe y cuánto sale: así el total ya es el final antes de elegir cómo pagar. */}
                    {!soloDigital && <ElegirEnvio eleccion={eleccion} cambiar={setEleccion} texto={calculo.texto} />}
                    <dl className="compra__cuentas">
                      {!soloDigital && (
                        <>
                          <div>
                            <dt>Productos</dt>
                            <dd>{precio(total(items))}</dd>
                          </div>
                          {eleccion.entrega === "envio" && (
                            <div>
                              <dt>Envío</dt>
                              <dd>{textoCosto(calculo.costo)}</dd>
                            </div>
                          )}
                        </>
                      )}
                      <div className="compra__total">
                        <dt>Total</dt>
                        <dd>{precio(total(items) + (calculo.costo ?? 0))}</dd>
                      </div>
                    </dl>
                    {pagoOnline && (
                      <>
                        <button className="boton boton--ancho" type="button" disabled={!calculo.listo} onClick={() => setComprando(true)}>
                          Pagar con Mercado Pago
                        </button>
                        <p className="bolsita__aviso">
                          {calculo.listo
                            ? "Tarjeta, débito o dinero en cuenta. Recibís un link para seguir tu pedido."
                            : "Poné tu código postal y provincia para calcular el envío."}
                        </p>
                        <p className="bolsita__o">
                          <span>o</span>
                        </p>
                      </>
                    )}
                    <div className="campo bolsita__nombre">
                      <label htmlFor="bolsita-nombre">Tu nombre (opcional)</label>
                      <input type="text" id="bolsita-nombre" autoComplete="given-name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    </div>
                    <a
                      className={pagoOnline ? "boton boton--claro boton--ancho" : "boton boton--ancho"}
                      href={enlaceWhatsApp(textoPedido(items, undefined, nombre.trim(), envioWhatsApp))}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => {
                        // El código se arma recién acá: el mensaje lo lleva y el panel lo muestra, así
                        // se reconoce el pedido. Guardarlo no frena la apertura de WhatsApp.
                        const codigo = nuevoCodigo();
                        e.currentTarget.href = enlaceWhatsApp(textoPedido(items, codigo, nombre.trim(), envioWhatsApp));
                        registrarPedidoWeb(codigo, items.map((r) => ({ id: r.producto.id, cantidad: r.cantidad })), nombre.trim());
                      }}
                    >
                      Enviar pedido por WhatsApp
                    </a>
                    <p className="bolsita__aviso">Se abre WhatsApp con tu pedido escrito. Ahí coordinamos el pago{soloDigital ? "" : " y la entrega"}.</p>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>

        <div className={`aviso${aviso.visible ? " visible" : ""}`} role="status">
          {aviso.texto}
        </div>
      </ContextoRenglones>
    </Contexto>
  );
}
