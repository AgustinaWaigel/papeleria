"use client";

import { useActionState } from "react";
import { avisarmeStock } from "@/app/(tienda)/acciones";

/* En un producto agotado: deja el mail y le avisamos cuando vuelva (lib/mails.ts → avisarStock). */
export function FormAvisoStock({ productoId }: { productoId: string }) {
  const [estado, accion, enviando] = useActionState(avisarmeStock, undefined);

  if (estado?.ok) {
    return (
      <p className="aviso-stock aviso-stock--listo" role="status">
        {estado.ok}
      </p>
    );
  }

  return (
    <form action={accion} className="aviso-stock">
      <input type="hidden" name="producto" value={productoId} />
      {/* Trampa para robots: oculta para las personas. */}
      <input type="text" name="sitio" tabIndex={-1} autoComplete="off" className="trampa" aria-hidden="true" />
      <label htmlFor="aviso-email">Se nos terminó. ¿Te avisamos cuando vuelva?</label>
      <div className="compra__fila">
        <input type="email" id="aviso-email" name="email" autoComplete="email" placeholder="tu@mail.com" required />
        <button className="boton boton--chico" type="submit" disabled={enviando}>
          {enviando ? "Anotando…" : "Avisame"}
        </button>
      </div>
      {estado?.error && (
        <span className="compra__error-chico" role="alert">
          {estado.error}
        </span>
      )}
    </form>
  );
}
