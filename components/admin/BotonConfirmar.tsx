"use client";

import type { ReactNode } from "react";

/* Un botón de enviar que pregunta antes. Va dentro de un <form action={…}>. */
export function BotonConfirmar({ pregunta, children }: { pregunta: string; children: ReactNode }) {
  return (
    <button
      className="admin__borrar"
      type="submit"
      onClick={(e) => {
        if (!confirm(pregunta)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
