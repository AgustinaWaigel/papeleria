"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { registrarPedidoWeb } from "@/app/(tienda)/acciones";
import {
  cambiarCantidad,
  cantidadesRenglon,
  foto,
  fotoServidor,
  lugarLibre,
  nuevoCodigo,
  renglones,
  subtotalRenglon,
  suscribir,
  textoPedido,
  total,
  vaciar,
  type EntregaPedido,
  type Renglon,
  type ResumenProducto,
} from "@/lib/bolsita";
import { enlaceWhatsApp, precio } from "@/lib/contacto";
import { ahorroPorCantidad } from "@/lib/productos";
import type { AjustesEnvio } from "@/lib/seguimiento";

type Acciones = { abrir: () => void; sumar: (id: string, cantidad?: number) => void };
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

/* Debajo de cada renglón: el descuento por cantidad que ya tiene y un atajo para llegar al próximo. */
export function PorCantidad({ renglon: r }: { renglon: Renglon }) {
  const { actual, siguiente } = cantidadesRenglon(r);
  const alcanza = siguiente && lugarLibre(r.producto, r.cantidad) >= siguiente.cantidad - r.cantidad;
  if (!actual && !alcanza) return null;
  return (
    <p className="bolsita__escala">
      {actual && <span className="bolsita__escala-ok">Ahorrás {precio(ahorroPorCantidad(r.producto, r.cantidad))} por cantidad</span>}
      {siguiente && alcanza && (
        <button type="button" onClick={() => cambiarCantidad(r.producto.id, siguiente.cantidad - r.cantidad)}>
          Llevá {siguiente.cantidad} y ahorrás {precio(ahorroPorCantidad(r.producto, siguiente.cantidad))}
        </button>
      )}
    </p>
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
  const soloDigital = items.length > 0 && items.every((r) => r.producto.tipo === "descargable");
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
    sumar: (id, cantidad = 1) => {
      const producto = porId.get(id);
      if (!producto) return;
      const libre = lugarLibre(producto, bolsita[id] ?? 0);
      if (libre > 0) {
        // Con x10 o x20 puede no haber tantos: se suma lo que queda.
        cambiarCantidad(id, Math.min(cantidad, libre));
        // Se abre sola, así se ve lo que se sumó y el camino para seguir.
        setAbierta(true);
        if (libre >= cantidad) return;
      }
      setAviso({
        texto: libre > 0 ? `Sumamos ${libre}: no nos quedan más de ${producto.nombre}` : `No nos quedan más de ${producto.nombre} por ahora`,
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
              {items.map((r) => {
                const { producto: p, cantidad } = r;
                return (
                <li className="bolsita__item" key={p.id}>
                  <strong>{p.nombre}</strong>
                  <span>{precio(subtotalRenglon(r))}</span>
                  <PorCantidad renglon={r} />
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
                );
              })}
            </ul>

            {items.length > 0 && (
              <div className="bolsita__pie">
                {/* La entrega, el envío y el pago (o el pedido por WhatsApp) se ven en la página de compra, paso por paso. */}
                <p className="bolsita__total">
                  Subtotal <span>{precio(total(items))}</span>
                </p>
                <Link className="boton boton--ancho" href="/comprar" onClick={cerrar}>
                  Continuar compra
                </Link>
                <p className="bolsita__aviso">
                  {soloDigital
                    ? pagoOnline
                      ? "Pagás con Mercado Pago y los PDF te llegan por mail."
                      : "En el siguiente paso nos mandás el pedido por WhatsApp."
                    : "En el siguiente paso elegís cómo lo recibís y ves el costo del envío."}
                </p>
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
