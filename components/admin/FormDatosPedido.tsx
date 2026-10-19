"use client";

import { startTransition, useActionState } from "react";
import { guardarDatosPedido } from "@/app/admin/pedidos/acciones";
import { MEDIOS_PAGO, type Pedido } from "@/lib/pedidos";
import { ENTREGAS } from "@/lib/seguimiento";

export function FormDatosPedido({ pedido: p }: { pedido: Pedido }) {
  const [estado, accion, enviando] = useActionState(guardarDatosPedido, undefined);

  return (
    <form
      className="admin__grupo"
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        startTransition(() => accion(datos));
      }}
    >
      <h2 className="admin__subtitulo">Cliente y pago</h2>
      <input type="hidden" name="id" value={p.id} />
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="p-nombre">Cliente</label>
          <input type="text" id="p-nombre" name="cliente_nombre" defaultValue={p.cliente_nombre ?? ""} />
        </div>
        <div className="campo">
          <label htmlFor="p-contacto">WhatsApp, Instagram o mail</label>
          <input type="text" id="p-contacto" name="cliente_contacto" defaultValue={p.cliente_contacto ?? ""} />
        </div>
      </div>
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="p-medio">Medio de pago</label>
          <input type="text" id="p-medio" name="medio_pago" list="medios-pago-pedido" defaultValue={p.medio_pago ?? ""} />
          <datalist id="medios-pago-pedido">
            {MEDIOS_PAGO.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div className="campo">
          <label htmlFor="p-fecha">Fecha</label>
          <input type="date" id="p-fecha" name="fecha" defaultValue={p.fecha} />
        </div>
      </div>
      {/* Existen desde supabase/04-pagos-online.sql: sin ese script, el pedido no trae la clave. */}
      {p.clave !== undefined && (
        <>
          <div className="editor__par">
            <div className="campo">
              <label htmlFor="p-email">Mail</label>
              <input type="email" id="p-email" name="cliente_email" defaultValue={p.cliente_email ?? ""} />
            </div>
            <div className="campo">
              <label htmlFor="p-entrega">Cómo lo recibe</label>
              <select id="p-entrega" name="entrega" defaultValue={p.entrega ?? ""}>
                <option value="">A coordinar</option>
                {ENTREGAS.map(([valor, nombre]) => (
                  <option key={valor} value={valor}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="campo">
            <label htmlFor="p-direccion">Dirección de envío</label>
            <input type="text" id="p-direccion" name="direccion" defaultValue={p.direccion ?? ""} />
          </div>
          <div className="campo">
            <label htmlFor="p-seguimiento">Número de seguimiento del envío</label>
            <input type="text" id="p-seguimiento" name="seguimiento" defaultValue={p.seguimiento ?? ""} aria-describedby="p-seguimiento-ayuda" />
            <span className="campo__ayuda" id="p-seguimiento-ayuda">
              El del correo (Correo Argentino, Andreani…). El cliente lo ve en su link de seguimiento.
            </span>
          </div>
        </>
      )}
      <div className="campo">
        <label htmlFor="p-notas">Notas</label>
        <textarea id="p-notas" name="notas" rows={3} defaultValue={p.notas ?? ""} placeholder="Dirección de envío, si es para regalo, lo que haga falta" />
      </div>
      {estado?.error && (
        <p className="admin__error" role="alert">
          {estado.error}
        </p>
      )}
      {estado?.ok && (
        <p className="admin__exito" role="status">
          {estado.ok}
        </p>
      )}
      <button className="boton" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar datos"}
      </button>
    </form>
  );
}
