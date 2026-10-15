"use client";

import { useActionState } from "react";
import { suscribirse } from "@/app/(tienda)/acciones";

export function FormSuscripcion() {
  const [estado, accion, enviando] = useActionState(suscribirse, undefined);

  return (
    <form action={accion} className="suscripcion" id="novedades">
      <h2>Novedades por mail</h2>
      <p>Productos nuevos, descargables y ofertas. Poquitos mails, prometido.</p>
      {estado?.ok ? (
        <p className="suscripcion__ok" role="status">
          {estado.ok}
        </p>
      ) : (
        <>
          <input type="text" name="sitio" tabIndex={-1} autoComplete="off" className="trampa" aria-hidden="true" />
          <div className="suscripcion__fila">
            <label className="sr-only" htmlFor="suscripcion-email">
              Tu mail
            </label>
            <input type="email" id="suscripcion-email" name="email" placeholder="tu@mail.com" autoComplete="email" required />
            <button className="boton boton--sol boton--chico" type="submit" disabled={enviando}>
              {enviando ? "Anotando…" : "Anotarme"}
            </button>
          </div>
          {estado?.error && (
            <p className="suscripcion__error" role="alert">
              {estado.error}
            </p>
          )}
        </>
      )}
    </form>
  );
}
