"use client";

import { useState } from "react";

/* Copia todos los mails separados por coma, listos para pegar en CCO. */
export function CopiarMails({ mails }: { mails: string[] }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="fila-botones">
      <button
        className="boton"
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(mails.join(", "));
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        }}
      >
        {copiado ? "¡Copiados!" : `Copiar los ${mails.length} mails`}
      </button>
      <a
        className="boton boton--claro"
        download="suscriptores.csv"
        href={`data:text/csv;charset=utf-8,${encodeURIComponent("email\n" + mails.join("\n"))}`}
      >
        Bajar CSV
      </a>
    </div>
  );
}
