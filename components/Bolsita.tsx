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

export function ProveedorBolsita({ catalogo, children }: { catalogo: ResumenProducto[]; children: React.ReactNode }) {
  const bolsita = useSyncExternalStore(suscribir, foto, fotoServidor);
  const porId = useMemo(() => new Map(catalogo.map((p) => [p.id, p])), [catalogo]);
  const items = useMemo(() => renglones(bolsita, (id) => porId.get(id)), [bolsita, porId]);
  const [abierta, setAbierta] = useState(false);
  const [aviso, setAviso] = useState({ texto: "", visible: false });
  const [nombre, setNombre] = useState("");
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
                <p className="bolsita__total">
                  Total <span>{precio(total(items))}</span>
                </p>
                <div className="campo bolsita__nombre">
                  <label htmlFor="bolsita-nombre">Tu nombre (opcional)</label>
                  <input type="text" id="bolsita-nombre" autoComplete="given-name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <a
                  className="boton boton--ancho"
                  href={enlaceWhatsApp(textoPedido(items, undefined, nombre.trim()))}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => {
                    // El código se arma recién acá: el mensaje lo lleva y el panel lo muestra, así
                    // se reconoce el pedido. Guardarlo no frena la apertura de WhatsApp.
                    const codigo = nuevoCodigo();
                    e.currentTarget.href = enlaceWhatsApp(textoPedido(items, codigo, nombre.trim()));
                    registrarPedidoWeb(codigo, items.map((r) => ({ id: r.producto.id, cantidad: r.cantidad })), nombre.trim());
                  }}
                >
                  Enviar pedido por WhatsApp
                </a>
                <p className="bolsita__aviso">Se abre WhatsApp con tu pedido escrito. Ahí coordinamos el pago y el envío.</p>
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
