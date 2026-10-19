"use client";

import { useActionState } from "react";
import { guardarEnvio } from "@/app/admin/tienda-acciones";
import type { AjustesEnvio } from "@/lib/seguimiento";

/* El costo del envío a domicilio que ve la bolsita. */
export function FormEnvio({ envio }: { envio: AjustesEnvio }) {
  const [estado, accion, guardando] = useActionState(guardarEnvio, undefined);

  return (
    <form action={accion} className="admin__grupo">
      <h2 className="admin__subtitulo">Para todas las zonas</h2>
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="e-costo">Costo por defecto, en pesos</label>
          <input type="text" inputMode="numeric" id="e-costo" name="envio_costo" defaultValue={envio.costo ?? ""} aria-describedby="e-costo-ayuda" />
          <span className="campo__ayuda" id="e-costo-ayuda">
            Para las zonas sin precio y las provincias sin zona. Vacío: ahí el envío se coordina por WhatsApp.
          </span>
        </div>
        <div className="campo">
          <label htmlFor="e-gratis">Gratis desde (opcional)</label>
          <input type="text" inputMode="numeric" id="e-gratis" name="envio_gratis_desde" defaultValue={envio.gratisDesde ?? ""} aria-describedby="e-gratis-ayuda" />
          <span className="campo__ayuda" id="e-gratis-ayuda">
            Con compras desde este monto (después del descuento), el envío no se cobra.
          </span>
        </div>
      </div>
      <div className="campo">
        <label htmlFor="e-detalle">Detalle que ve quien compra (opcional)</label>
        <input
          type="text"
          id="e-detalle"
          name="envio_detalle"
          maxLength={200}
          defaultValue={envio.detalle ?? ""}
          placeholder="Por ejemplo: Por Correo Argentino a todo el país, llega en 3 a 7 días hábiles."
        />
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
      <button className="boton" type="submit" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
