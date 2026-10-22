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
  vaciar,
  type EntregaPedido,
  type Renglon,
  type ResumenProducto,
} from "@/lib/bolsita";
import { enlaceWhatsApp, precio } from "@/lib/contacto";
import { CRESPO, SOLO_CRESPO } from "@/lib/zonas";
import type { AjustesEnvio } from "@/lib/seguimiento";
import { destinoCorto, ElegirEnvio, textoCosto, useEnvio, type EleccionEnvio } from "./Envio";

type Acciones = { abrir: () => void; sumar: (id: string) => void };
type AjustesCompra = { pagoOnline: boolean; envio: AjustesEnvio; cotizaCorreo: boolean };

const Contexto = createContext<Acciones | null>(null);
const ContextoRenglones = createContext<Renglon[]>([]);
const ContextoCompra = createContext<AjustesCompra | null>(null);

/* Lo que necesita la página de compra para calcular el envío (lo mismo que recibe la bolsita). */
export function useAjustesCompra() {
  const ajustes = useContext(ContextoCompra);
  if (!ajustes) throw new Error("useAjustesCompra se usa dentro de <ProveedorBolsita>");
  return ajustes;
}

/* "Enviar pedido por WhatsApp": abre el chat con el pedido escrito, lo guarda en el panel y vacía la bolsita. */
export function PedirPorWhatsApp({ items, nombre, entrega, claro, alEnviar }: {
  items: Renglon[];
  nombre: string;
  entrega?: EntregaPedido;
  claro?: boolean;
  alEnviar: (pedido: { codigo: string; href: string }) => void;
}) {
  return (
    <a
      className={claro ? "boton boton--claro boton--ancho" : "boton boton--ancho"}
      href={enlaceWhatsApp(textoPedido(items, { nombre: nombre.trim(), entrega }))}
      target="_blank"
      rel="noopener"
      onClick={(e) => {
        // El código se arma recién acá: el mensaje lo lleva y el panel lo muestra, así
        // se reconoce el pedido. Guardarlo no frena la apertura de WhatsApp.
        const codigo = nuevoCodigo();
        e.currentTarget.href = enlaceWhatsApp(textoPedido(items, { codigo, nombre: nombre.trim(), entrega }));
        registrarPedidoWeb(codigo, items.map((r) => ({ id: r.producto.id, cantidad: r.cantidad })), nombre.trim());
        // El pedido ya salió: la bolsita se vacía (después de que el navegador abra WhatsApp).
        const href = e.currentTarget.href;
        setTimeout(() => {
          vaciar();
          alEnviar({ codigo, href });
        }, 300);
      }}
    >
      Enviar pedido por WhatsApp
    </a>
  );
}

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
  const ajustesCompra = useMemo(() => ({ pagoOnline, envio, cotizaCorreo }), [pagoOnline, envio, cotizaCorreo]);
  const [abierta, setAbierta] = useState(false);
  const [aviso, setAviso] = useState({ texto: "", visible: false });
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [pedidoEnviado, setPedidoEnviado] = useState<{ codigo: string; href: string } | null>(null); // recién mandado por WhatsApp

  // Sin pago online, cómo lo recibe se elige acá, para el mensaje de WhatsApp (si todo es descargable, no hay
  // nada que elegir). Con pago online se elige en la página de compra.
  const soloDigital = items.length > 0 && items.every((r) => r.producto.tipo === "descargable");
  const [eleccion, setEleccion] = useState<EleccionEnvio>(
    SOLO_CRESPO ? { entrega: "retiro", ...CRESPO } : { entrega: "retiro", cp: "", provincia: "" },
  );
  const eleccionReal: EleccionEnvio = soloDigital ? { ...eleccion, entrega: "digital" } : eleccion;
  const calculo = useEnvio({ items, envio, cotizaCorreo, eleccion: eleccionReal });
  // Lo que dice el mensaje de WhatsApp sobre la entrega (con pago online, se coordina en el chat).
  const envioWhatsApp: EntregaPedido | undefined = soloDigital
    ? { tipo: "digital" }
    : pagoOnline
      ? undefined
      : eleccion.entrega === "retiro"
        ? { tipo: "retiro" }
        : {
            tipo: "envio",
            destino: calculo.destinoListo ? destinoCorto(eleccion.cp, eleccion.provincia) : undefined,
            costo: calculo.costo,
            direccion,
          };
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
      if (libre > 0) {
        cambiarCantidad(id, 1);
        // Se abre sola, así se ve lo que se sumó y el camino para pagar.
        setPedidoEnviado(null);
        setAbierta(true);
        return;
      }
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
       <ContextoCompra value={ajustesCompra}>
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
              {items.length === 0 && pedidoEnviado && (
                <li className="bolsita__vacia">
                  <span className="nota-mano">¡pedido enviado!</span>
                  Te abrimos WhatsApp con tu pedido <strong>{pedidoEnviado.codigo}</strong>. Si no se abrió,{" "}
                  <a href={pedidoEnviado.href} target="_blank" rel="noopener">
                    tocá acá
                  </a>
                  .
                </li>
              )}
              {items.length === 0 && !pedidoEnviado && (
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
                {pagoOnline ? (
                  <>
                    {/* La entrega, el envío y el pago se ven en la página de compra, paso por paso. */}
                    <p className="bolsita__total">
                      Subtotal <span>{precio(total(items))}</span>
                    </p>
                    <Link className="boton boton--ancho" href="/comprar" onClick={cerrar}>
                      Continuar compra
                    </Link>
                    <p className="bolsita__aviso">
                      {soloDigital ? "Pagás con Mercado Pago y los PDF te llegan por mail." : "En el siguiente paso elegís cómo lo recibís y ves el costo del envío."}
                    </p>
                    <p className="bolsita__o">
                      <span>o</span>
                    </p>
                  </>
                ) : (
                  <>
                    {/* Primero cómo lo recibe y cuánto sale: así el total del mensaje ya es el final. */}
                    {!soloDigital && <ElegirEnvio eleccion={eleccion} cambiar={setEleccion} texto={calculo.texto} />}
                    {!soloDigital && eleccion.entrega === "envio" && (
                      <div className="campo bolsita__nombre">
                        <label htmlFor="bolsita-direccion">Dirección de entrega</label>
                        <input
                          type="text"
                          id="bolsita-direccion"
                          autoComplete="street-address"
                          placeholder="Calle, número, piso y ciudad"
                          value={direccion}
                          onChange={(e) => setDireccion(e.target.value)}
                        />
                      </div>
                    )}
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
                              <dd>{textoCosto(calculo.costo, calculo.cotizando)}</dd>
                            </div>
                          )}
                        </>
                      )}
                      <div className="compra__total">
                        <dt>Total</dt>
                        <dd>{precio(total(items) + (calculo.costo ?? 0))}</dd>
                      </div>
                    </dl>
                  </>
                )}
                <div className="campo bolsita__nombre">
                  <label htmlFor="bolsita-nombre">Tu nombre (opcional)</label>
                  <input type="text" id="bolsita-nombre" autoComplete="given-name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <PedirPorWhatsApp items={items} nombre={nombre} entrega={envioWhatsApp} claro={pagoOnline} alEnviar={setPedidoEnviado} />
                <p className="bolsita__aviso">Se abre WhatsApp con tu pedido escrito. Ahí coordinamos el pago{soloDigital ? "" : " y la entrega"}.</p>
              </div>
            )}
          </aside>
        </div>

        <div className={`aviso${aviso.visible ? " visible" : ""}`} role="status">
          {aviso.texto}
        </div>
       </ContextoCompra>
      </ContextoRenglones>
    </Contexto>
  );
}
