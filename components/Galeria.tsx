"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";

/* Fotos de un producto: una grande y, si hay más de una, miniaturas para elegir.
   Tocando la grande se abre el visor, con la foto entera (en la ficha va recortada a 4:3).
   Sin fotos muestra lo que reciba como hijo (el dibujo del producto). */
export function Galeria({ fotos, nombre, children }: { fotos: string[]; nombre: string; children: ReactNode }) {
  const [actual, setActual] = useState(0);
  const visor = useRef<HTMLDialogElement>(null);

  if (fotos.length === 0) return <div className="galeria__principal galeria__principal--dibujo">{children}</div>;

  const varias = fotos.length > 1;
  const pasar = (salto: number) => setActual((n) => (n + salto + fotos.length) % fotos.length);

  return (
    <div className="galeria">
      <button
        type="button"
        className="galeria__principal galeria__abrir"
        aria-label={`Ver la foto ${actual + 1} entera`}
        onClick={() => visor.current?.showModal()}
      >
        {/* La key cambia con la foto: la nueva entra con un fundido. */}
        <Image
          key={fotos[actual]}
          className="galeria__foto"
          src={fotos[actual]}
          alt={`${nombre}, foto ${actual + 1} de ${fotos.length}`}
          fill
          sizes="(min-width: 52rem) 36rem, 100vw"
        />
        <span className="galeria__lupa" aria-hidden="true">
          Ver entera
        </span>
      </button>
      {varias && (
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

      <dialog
        ref={visor}
        className="visor"
        aria-label={`Fotos de ${nombre}`}
        // Tocar afuera de la foto cierra; las flechas del teclado pasan de foto (Escape ya cierra solo).
        onClick={(e) => {
          if (e.target === e.currentTarget || e.target === e.currentTarget.firstElementChild) e.currentTarget.close();
        }}
        onKeyDown={(e) => {
          if (!varias) return;
          if (e.key === "ArrowRight") pasar(1);
          if (e.key === "ArrowLeft") pasar(-1);
        }}
      >
        <div className="visor__marco">
          {/* El marco tiene tamaño fijo y la foto entra entera adentro (object-fit: contain):
              así el visor no se achica mientras la foto carga. */}
          <Image
            key={fotos[actual]}
            className="visor__foto galeria__foto"
            src={fotos[actual]}
            alt={`${nombre}, foto ${actual + 1} de ${fotos.length}`}
            fill
            sizes="100vw"
          />
        </div>
        <button type="button" className="visor__boton visor__cerrar" aria-label="Cerrar" autoFocus onClick={() => visor.current?.close()}>
          ✕
        </button>
        {varias && (
          <>
            <button type="button" className="visor__boton visor__anterior" aria-label="Foto anterior" onClick={() => pasar(-1)}>
              ‹
            </button>
            <button type="button" className="visor__boton visor__siguiente" aria-label="Foto siguiente" onClick={() => pasar(1)}>
              ›
            </button>
            <p className="visor__cuenta">
              {actual + 1} / {fotos.length}
            </p>
          </>
        )}
      </dialog>
    </div>
  );
}
