"use client";

import { useActionState } from "react";
import { dejarResena } from "@/app/(tienda)/acciones";

export function FormResena({ productoId }: { productoId: string }) {
  const [estado, accion, enviando] = useActionState(dejarResena, undefined);

  if (estado?.ok) {
    return (
      <div className="papelito resenas__gracias" role="status">
        <h3>¡Gracias!</h3>
        <p>{estado.ok}</p>
      </div>
    );
  }

  return (
    <form action={accion} className="resenas__form">
      <h3>Dejá tu reseña</h3>
      <input type="hidden" name="producto" value={productoId} />
      {/* Trampa para robots: oculta para las personas. */}
      <input type="text" name="sitio" tabIndex={-1} autoComplete="off" className="trampa" aria-hidden="true" />
      <fieldset className="campo">
        <legend>Puntaje</legend>
        <div className="estrellas-elegir">
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n}>
              <input type="radio" name="puntaje" value={n} required defaultChecked={n === 5} />
              <span aria-hidden="true">★</span>
              <span className="sr-only">
                {n} {n === 1 ? "estrella" : "estrellas"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="campo">
        <label htmlFor="resena-nombre">Tu nombre</label>
        <input type="text" id="resena-nombre" name="nombre" maxLength={60} autoComplete="given-name" required />
      </div>
      <div className="campo">
        <label htmlFor="resena-texto">Qué te pareció</label>
        <textarea id="resena-texto" name="texto" maxLength={1000} required />
      </div>
      {estado?.error && (
        <p className="admin__error" role="alert">
          {estado.error}
        </p>
      )}
      <button className="boton" type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar reseña"}
      </button>
      <p className="campo__ayuda mt-e3">La publicamos después de leerla.</p>
    </form>
  );
}
