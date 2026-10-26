"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/* "Mirá por dentro": las hojas de muestra de un producto en miniatura; tocando una se abre entera en el visor
   (el mismo de components/Galeria.tsx). */
export function PorDentro({ muestras, nombre }: { muestras: string[]; nombre: string }) {
  const [actual, setActual] = useState(0);
  const visor = useRef<HTMLDialogElement>(null);
  const varias = muestras.length > 1;
  const pasar = (salto: number) => setActual((n) => (n + salto + muestras.length) % muestras.length);
  const abrir = (n: number) => {
    setActual(n);
    visor.current?.showModal();
  };

  return (
    <>
      <ul className="por-dentro">
        {muestras.map((m, n) => (
          <li key={m}>
            <button type="button" aria-label={`Ver la hoja de muestra ${n + 1} entera`} onClick={() => abrir(n)}>
              <Image src={m} alt="" fill sizes="(min-width: 52rem) 14rem, 45vw" />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={visor}
        className="visor"
        aria-label={`Hojas de muestra de ${nombre}`}
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
          <Image
            key={muestras[actual]}
            className="visor__foto galeria__foto"
            src={muestras[actual]}
            alt={`${nombre}, hoja de muestra ${actual + 1} de ${muestras.length}`}
            fill
            sizes="100vw"
          />
        </div>
        <button type="button" className="visor__boton visor__cerrar" aria-label="Cerrar" autoFocus onClick={() => visor.current?.close()}>
          ✕
        </button>
        {varias && (
          <>
            <button type="button" className="visor__boton visor__anterior" aria-label="Hoja anterior" onClick={() => pasar(-1)}>
              ‹
            </button>
            <button type="button" className="visor__boton visor__siguiente" aria-label="Hoja siguiente" onClick={() => pasar(1)}>
              ›
            </button>
            <p className="visor__cuenta">
              {actual + 1} / {muestras.length}
            </p>
          </>
        )}
      </dialog>
    </>
  );
}
