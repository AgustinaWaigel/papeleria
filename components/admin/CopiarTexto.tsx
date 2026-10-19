"use client";

import { useState } from "react";

/* Un botón que copia un texto (por ejemplo, el link de seguimiento para mandarle al cliente). */
export function CopiarTexto({ texto, children, className = "boton boton--claro boton--ancho" }: { texto: string; children: React.ReactNode; className?: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      className={className}
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
    >
      {copiado ? "¡Copiado!" : children}
    </button>
  );
}
