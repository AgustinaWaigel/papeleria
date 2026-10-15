"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

/* Fotos de un producto: una grande y, si hay más de una, miniaturas para elegir.
   Sin fotos muestra lo que reciba como hijo (el dibujo del producto). */
export function Galeria({ fotos, nombre, children }: { fotos: string[]; nombre: string; children: ReactNode }) {
  const [actual, setActual] = useState(0);

  if (fotos.length === 0) return <div className="galeria__principal galeria__principal--dibujo">{children}</div>;

  return (
    <div className="galeria">
      <div className="galeria__principal">
        {/* La key cambia con la foto: la nueva entra con un fundido. */}
        <Image
          key={fotos[actual]}
          className="galeria__foto"
          src={fotos[actual]}
          alt={`${nombre}, foto ${actual + 1} de ${fotos.length}`}
          fill
          sizes="(min-width: 52rem) 36rem, 100vw"
        />
      </div>
      {fotos.length > 1 && (
        <ul className="galeria__miniaturas">
          {fotos.map((foto, n) => (
            <li key={foto}>
              <button type="button" aria-pressed={n === actual} aria-label={`Ver foto ${n + 1}`} onClick={() => setActual(n)}>
                <Image src={foto} alt="" fill sizes="5rem" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
