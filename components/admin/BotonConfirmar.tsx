"use client";

import { useRef, type ReactNode } from "react";

type Props = {
  pregunta: string;
  children: ReactNode;
  /* Lo que dice el botón de confirmar (por defecto, el mismo texto que el botón). */
  confirmar?: string;
  formAction?: (datos: FormData) => void;
};

/* Un botón de enviar que pregunta antes, con una ventanita propia en vez del cartel del navegador.
   Va dentro de un <form action={…}>. Al confirmar, envía el formulario como si se hubiera tocado el botón. */
export function BotonConfirmar({ pregunta, children, confirmar, formAction }: Props) {
  const boton = useRef<HTMLButtonElement>(null);
  const ventana = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        ref={boton}
        className="admin__borrar"
        type="submit"
        formAction={formAction}
        onClick={(e) => {
          e.preventDefault();
          ventana.current?.showModal();
        }}
      >
        {children}
      </button>
      <dialog
        ref={ventana}
        className="confirmar"
        // Tocar afuera de la tarjeta cierra sin hacer nada.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="confirmar__tarjeta">
          <p className="confirmar__pregunta">{pregunta}</p>
          <p className="confirmar__nota">No se puede deshacer.</p>
          <div className="confirmar__botones">
            <button className="boton boton--claro boton--chico" type="button" autoFocus onClick={() => ventana.current?.close()}>
              Cancelar
            </button>
            <button
              className="boton boton--chico confirmar__si"
              type="button"
              onClick={() => {
                ventana.current?.close();
                boton.current?.form?.requestSubmit(boton.current);
              }}
            >
              {confirmar ?? children}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
