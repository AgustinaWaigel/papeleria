"use client";

import { useActionState } from "react";
import { pedirArrepentimiento } from "@/app/(tienda)/acciones";

/* El formulario del botón de arrepentimiento: al mandarlo, muestra el código de trámite en el momento. */
export function FormArrepentimiento() {
  const [estado, accion, enviando] = useActionState(pedirArrepentimiento, undefined);

  if (estado?.codigo) {
    return (
      <div className="papelito arrepentimiento__listo" role="status">
        <h2>Listo, lo registramos</h2>
        <p>Tu código de trámite es</p>
        <p className="arrepentimiento__codigo">{estado.codigo}</p>
        <p>
          Te mandamos el comprobante por mail. Te escribimos dentro de las próximas 24 horas para coordinar la devolución.
        </p>
      </div>
    );
  }

  return (
    <form action={accion} className="arrepentimiento__form">
      {/* Trampa para robots: oculta para las personas. */}
      <input type="text" name="sitio" tabIndex={-1} autoComplete="off" className="trampa" aria-hidden="true" />
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="arr-nombre">Nombre y apellido</label>
          <input type="text" id="arr-nombre" name="nombre" autoComplete="name" required maxLength={80} />
        </div>
        <div className="campo">
          <label htmlFor="arr-email">Mail</label>
          <input type="email" id="arr-email" name="email" autoComplete="email" required maxLength={120} />
        </div>
      </div>
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="arr-telefono">Teléfono (opcional)</label>
          <input type="tel" id="arr-telefono" name="telefono" autoComplete="tel" maxLength={40} />
        </div>
        <div className="campo">
          <label htmlFor="arr-pedido">N.º de pedido (opcional)</label>
          <input type="text" id="arr-pedido" name="pedido" placeholder="AA-XXXXX" maxLength={20} />
        </div>
      </div>
      <div className="campo">
        <label htmlFor="arr-motivo">¿Querés contarnos algo? (opcional)</label>
        <textarea id="arr-motivo" name="motivo" rows={3} maxLength={1000} />
      </div>
      {estado?.error && (
        <p className="compra__error" role="alert">
          {estado.error}
        </p>
      )}
      <button className="boton" type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Quiero cancelar mi compra"}
      </button>
    </form>
  );
}
