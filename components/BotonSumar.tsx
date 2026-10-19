"use client";

import { useAccionesBolsita } from "./Bolsita";

export function BotonSumar({ id, nombre, grande, agotado }: { id: string; nombre: string; grande?: boolean; agotado?: boolean }) {
  const { sumar } = useAccionesBolsita();
  if (agotado) {
    return (
      <button className={`boton boton--claro${grande ? "" : " boton--chico"}`} type="button" disabled>
        Sin stock<span className="sr-only">: {nombre}</span>
      </button>
    );
  }
  if (grande) {
    return (
      <button className="boton" type="button" onClick={() => sumar(id)}>
        Agregar a la bolsita
      </button>
    );
  }
  return (
    <button className="boton boton--chico" type="button" onClick={() => sumar(id)}>
      Comprar<span className="sr-only"> {nombre} a la bolsita</span>
    </button>
  );
}
