"use client";

import { useState, type FormEvent } from "react";
import { enlaceWhatsApp } from "@/lib/contacto";

const IDEAS = [
  "Qué querés: cuaderno, agenda, libreta, cartuchera…",
  "El tamaño y el interior (rayado, punteado, liso)",
  "Colores, dibujos o un estilo que te guste",
  "El nombre o la frase que va en la tapa",
  "Si es para regalar, para quién es",
];

/* El cliente cuenta su idea con sus palabras y nos la manda por WhatsApp: el diseño lo charlamos en el chat.
   Sin emojis en el texto: viajan en el link de WhatsApp (ver textoPedido en lib/bolsita.ts). */
export function PedidoPersonalizado() {
  const [nombre, setNombre] = useState("");
  const [idea, setIdea] = useState("");
  const [fecha, setFecha] = useState("");

  function enviar(e: FormEvent) {
    e.preventDefault();
    const lineas = [
      nombre.trim() ? `¡Hola Alas de Ángel! Soy ${nombre.trim()} y quiero un personalizado:` : "¡Hola Alas de Ángel! Quiero un personalizado:",
      "",
      idea.trim(),
      ...(fecha.trim() ? ["", `Lo necesito para: ${fecha.trim()}`] : []),
    ];
    const enlace = enlaceWhatsApp(lineas.join("\n"));
    // Sin "noopener" en window.open: con esa opción devuelve null y no se sabe si se abrió.
    const ventana = window.open(enlace, "_blank");
    if (ventana) ventana.opener = null;
    else window.location.href = enlace;
  }

  return (
    <div className="contenedor personalizado">
      <aside className="personalizado__ideas">
        <h2>¿Qué nos contás?</h2>
        <ul>
          {IDEAS.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        <p>
          Si tenés una foto o un dibujo de referencia, mandalo después en el chat. Te pasamos precio y fecha de entrega,
          y antes de hacerlo te mostramos una muestra para que la apruebes.
        </p>
      </aside>

      <form onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="pe-nombre">Tu nombre (opcional)</label>
          <input type="text" id="pe-nombre" autoComplete="given-name" maxLength={60} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="pe-idea">Contanos tu idea</label>
          <textarea
            id="pe-idea"
            rows={7}
            required
            maxLength={1500}
            placeholder="Por ejemplo: una agenda A5 con tapa rosa, una luna dibujada y el nombre «Sofi», con interior punteado."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="pe-fecha">¿Para cuándo lo necesitás? (opcional)</label>
          <input type="text" id="pe-fecha" maxLength={60} placeholder="Por ejemplo: para el 20 de diciembre" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <button className="boton boton--ancho" type="submit">
          Mandar mi idea por WhatsApp
        </button>
      </form>
    </div>
  );
}
