"use client";

import { useActionState } from "react";
import { pedirPresupuesto } from "@/app/(tienda)/acciones";
import { enlaceWhatsApp, TIPOS_PRESUPUESTO } from "@/lib/contacto";

/* El pedido de presupuesto por mayor: al mandarlo, muestra el número en el momento y el atajo a WhatsApp. */
export function FormPresupuesto() {
  const [estado, accion, enviando] = useActionState(pedirPresupuesto, undefined);

  if (estado?.codigo) {
    return (
      <div className="papelito arrepentimiento__listo" role="status">
        <h2>¡Recibimos tu pedido!</h2>
        <p>Tu número de pedido es</p>
        <p className="arrepentimiento__codigo">{estado.codigo}</p>
        <p>Te escribimos en uno o dos días hábiles con el precio y los tiempos. Si es urgente, avisanos por WhatsApp.</p>
        <a className="boton boton--claro" href={enlaceWhatsApp(`¡Hola! Les mandé el pedido de presupuesto ${estado.codigo}.`)} target="_blank" rel="noopener">
          Escribir por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form action={accion} className="arrepentimiento__form">
      {/* Trampa para robots: oculta para las personas. */}
      <input type="text" name="sitio" tabIndex={-1} autoComplete="off" className="trampa" aria-hidden="true" />
      <fieldset className="campo">
        <legend>¿Para qué es?</legend>
        <div className="opciones">
          {TIPOS_PRESUPUESTO.map(([valor, nombre], n) => (
            <label key={valor} className="opcion">
              <input type="radio" name="tipo" value={valor} defaultChecked={n === 0} />
              <span>{nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="pr-nombre">Nombre y apellido</label>
          <input type="text" id="pr-nombre" name="nombre" autoComplete="name" required maxLength={80} />
        </div>
        <div className="campo">
          <label htmlFor="pr-organizacion">Emprendimiento, escuela o evento (opcional)</label>
          <input type="text" id="pr-organizacion" name="organizacion" maxLength={120} />
        </div>
      </div>
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="pr-email">Mail</label>
          <input type="email" id="pr-email" name="email" autoComplete="email" required maxLength={120} />
        </div>
        <div className="campo">
          <label htmlFor="pr-telefono">WhatsApp (opcional)</label>
          <input type="tel" id="pr-telefono" name="telefono" autoComplete="tel" maxLength={40} />
        </div>
      </div>
      <div className="campo">
        <label htmlFor="pr-detalle">¿Qué necesitás y cuántos?</label>
        <textarea
          id="pr-detalle"
          name="detalle"
          rows={5}
          required
          maxLength={3000}
          placeholder="Por ejemplo: 30 cuadernos A5 con el logo del jardín, 30 agendas para docentes…"
        />
      </div>
      <div className="campo">
        <label htmlFor="pr-fecha">¿Para cuándo? (opcional)</label>
        <input type="text" id="pr-fecha" name="fecha" placeholder="Por ejemplo: antes del 15 de marzo" maxLength={60} />
      </div>
      {estado?.error && (
        <p className="compra__error" role="alert">
          {estado.error}
        </p>
      )}
      <button className="boton" type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Pedir presupuesto"}
      </button>
    </form>
  );
}
