"use client";

import { startTransition, useActionState } from "react";
import { guardarDatosPedido } from "@/app/admin/pedidos/acciones";
import { MEDIOS_PAGO, type Pedido } from "@/lib/pedidos";

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
