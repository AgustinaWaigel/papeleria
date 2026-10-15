"use client";

import { enlaceWhatsApp } from "@/lib/contacto";
import { ABIERTAS } from "@/lib/paginas";

const MOTIVOS = [
  "Una consulta sobre un producto",
  ...(ABIERTAS.personalizados ? ["Un pedido personalizado"] : []),
  "Un pedido por mayor",
  "Un problema con mi compra",
  "Otra cosa",
];

export function FormularioContacto() {
  // En onSubmit y no en action: la ventana tiene que abrirse dentro del clic o el navegador la bloquea.
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const nombre = String(datos.get("nombre")).trim();
    const mensaje = String(datos.get("mensaje")).trim();
    const texto = `¡Hola Alas de Ángel! Soy ${nombre}.\nTe escribo por: ${datos.get("motivo")}\n\n${mensaje}`;
    window.open(enlaceWhatsApp(texto), "_blank", "noopener");
  }

  return (
    <form onSubmit={enviar}>
      <div className="campo">
        <label htmlFor="contacto-nombre">Tu nombre</label>
        <input type="text" id="contacto-nombre" name="nombre" autoComplete="given-name" required />
      </div>
      <div className="campo">
        <label htmlFor="contacto-motivo">Por qué nos escribís</label>
        <select id="contacto-motivo" name="motivo">
          {MOTIVOS.map((motivo) => (
            <option key={motivo}>{motivo}</option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="contacto-mensaje">Tu mensaje</label>
        <textarea id="contacto-mensaje" name="mensaje" required />
      </div>
      <button className="boton" type="submit">
        Enviar por WhatsApp
      </button>
      <p className="campo__ayuda mt-e3">Se abre WhatsApp con el mensaje ya escrito, listo para mandar.</p>
    </form>
  );
}
