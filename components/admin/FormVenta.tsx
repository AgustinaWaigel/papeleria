"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { registrarVenta } from "@/app/admin/pedidos/acciones";
import { precio as formato } from "@/lib/contacto";
import { ESTADOS, MEDIOS_PAGO } from "@/lib/pedidos";

export type OpcionProducto = { id: string; nombre: string; precio: number; stock?: number };
type Renglon = { clave: number; id: string | null; nombre: string; precio: string; cantidad: string };

let siguienteClave = 0;
const renglon = (p?: OpcionProducto): Renglon => ({
  clave: siguienteClave++,
  id: p?.id ?? null,
  nombre: p?.nombre ?? "",
  precio: p ? String(p.precio) : "",
  cantidad: "1",
});

export function FormVenta({ productos, hoy }: { productos: OpcionProducto[]; hoy: string }) {
  const [estado, accion, enviando] = useActionState(registrarVenta, undefined);
  const [renglones, setRenglones] = useState<Renglon[]>([]);
  const porId = new Map(productos.map((p) => [p.id, p]));
  const total = renglones.reduce((s, r) => s + (Number(r.precio) || 0) * (Number(r.cantidad) || 0), 0);

  const cambiar = (clave: number, cambios: Partial<Renglon>) =>
    setRenglones((lista) => lista.map((r) => (r.clave === clave ? { ...r, ...cambios } : r)));

  function sumar(valor: string) {
    if (!valor) return;
    if (valor === "otro") return setRenglones((lista) => [...lista, renglon()]);
    const producto = porId.get(valor);
    if (!producto) return;
    // Si ya estaba, suma uno en vez de repetir el renglón.
    const existente = renglones.find((r) => r.id === valor);
    if (existente) cambiar(existente.clave, { cantidad: String((Number(existente.cantidad) || 0) + 1) });
    else setRenglones((lista) => [...lista, renglon(producto)]);
  }

  return (
    <form
      className="venta"
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        const items = renglones.map((r) => ({ id: r.id, nombre: r.nombre, precio: Number(r.precio), cantidad: Number(r.cantidad) }));
        datos.set("items", JSON.stringify(items));
        startTransition(() => accion(datos));
      }}
    >
      <fieldset className="admin__grupo">
        <legend>Qué se vendió</legend>
        <div className="campo">
          <label htmlFor="v-sumar">Sumar un producto</label>
          <select id="v-sumar" value="" onChange={(e) => sumar(e.target.value)}>
            <option value="">Elegí del catálogo…</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {formato(p.precio)}
                {p.stock !== undefined ? ` (stock: ${p.stock})` : ""}
              </option>
            ))}
            <option value="otro">Otra cosa (no está en el catálogo)</option>
          </select>
        </div>

        {renglones.length > 0 && (
          <ul className="venta__renglones">
            {renglones.map((r) => {
              const stock = r.id ? porId.get(r.id)?.stock : undefined;
              const pasado = stock !== undefined && Number(r.cantidad) > stock;
              return (
                <li key={r.clave} className="venta__renglon">
                  {r.id ? (
                    <strong>{r.nombre}</strong>
                  ) : (
                    <input
                      type="text"
                      aria-label="Qué se vendió"
                      placeholder="Ej.: señalador de regalo"
                      value={r.nombre}
                      onChange={(e) => cambiar(r.clave, { nombre: e.target.value })}
                      required
                    />
                  )}
                  <label>
                    <span>Cantidad</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={r.cantidad}
                      onChange={(e) => cambiar(r.clave, { cantidad: e.target.value.replace(/\D/g, "") })}
                    />
                  </label>
                  <label>
                    <span>Precio c/u</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={r.precio}
                      onChange={(e) => cambiar(r.clave, { precio: e.target.value.replace(/\D/g, "") })}
                    />
                  </label>
                  <button type="button" className="admin__borrar" onClick={() => setRenglones((l) => l.filter((x) => x.clave !== r.clave))}>
                    Sacar
                  </button>
                  {pasado && <small className="venta__aviso">Solo hay {stock} en stock: va a quedar en 0.</small>}
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>

      <fieldset className="admin__grupo">
        <legend>Datos de la venta</legend>
        <div className="editor__par">
          <div className="campo">
            <label htmlFor="v-fecha">Fecha</label>
            <input type="date" id="v-fecha" name="fecha" defaultValue={hoy} max={hoy} />
          </div>
          <div className="campo">
            <label htmlFor="v-estado">Estado</label>
            <select id="v-estado" name="estado" defaultValue="entregado" aria-describedby="v-estado-ayuda">
              {ESTADOS.map(([valor, nombre]) => (
                <option key={valor} value={valor}>
                  {nombre}
                </option>
              ))}
            </select>
            <span className="campo__ayuda" id="v-estado-ayuda">
              Pagado, enviado o entregado descuentan el stock.
            </span>
          </div>
        </div>
        <div className="editor__par">
          <div className="campo">
            <label htmlFor="v-medio">Medio de pago</label>
            <input type="text" id="v-medio" name="medio_pago" list="medios-pago" placeholder="Efectivo, transferencia…" />
            <datalist id="medios-pago">
              {MEDIOS_PAGO.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div className="campo">
            <label htmlFor="v-nombre">Cliente (opcional)</label>
            <input type="text" id="v-nombre" name="cliente_nombre" />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="v-contacto">WhatsApp, Instagram o mail (opcional)</label>
          <input type="text" id="v-contacto" name="cliente_contacto" />
        </div>
        <div className="campo">
          <label htmlFor="v-notas">Notas (opcional)</label>
          <textarea id="v-notas" name="notas" rows={3} placeholder="Ej.: vendido en la feria de Palermo, envuelto para regalo" />
        </div>
      </fieldset>

      {/* Al final del formulario y pegado al pie de la pantalla: el total y el botón siempre a mano. */}
      <div className="venta__pie">
        {estado?.error && (
          <p className="admin__error venta__error" role="alert">
            {estado.error}
          </p>
        )}
        <div className="venta__total">
          <span>Total</span>
          <strong aria-live="polite">{formato(total)}</strong>
          <small>{renglones.reduce((s, r) => s + (Number(r.cantidad) || 0), 0)} unidades</small>
        </div>
        <div className="venta__botones">
          <Link className="boton boton--claro" href="/admin/pedidos">
            Volver sin guardar
          </Link>
          <button className="boton" type="submit" disabled={enviando || renglones.length === 0}>
            {enviando ? "Guardando…" : "Registrar venta"}
          </button>
        </div>
      </div>
    </form>
  );
}
