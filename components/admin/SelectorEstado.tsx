"use client";

import { useOptimistic, useTransition } from "react";
import { cambiarEstado } from "@/app/admin/pedidos/acciones";
import { ESTADOS, type EstadoPedido } from "@/lib/pedidos";

/* Cambia el estado de un pedido apenas se elige otro: no hace falta un botón de guardar. */
export function SelectorEstado({ id, estado }: { id: number; estado: EstadoPedido }) {
  const [actual, setActual] = useOptimistic(estado);
  const [guardando, iniciar] = useTransition();

  return (
    <select
      className={`estado estado--${actual}`}
      aria-label="Estado del pedido"
      aria-busy={guardando}
      value={actual}
      onChange={(e) => {
        const nuevo = e.target.value as EstadoPedido;
        const datos = new FormData();
        datos.set("id", String(id));
        datos.set("estado", nuevo);
        iniciar(async () => {
          setActual(nuevo);
          await cambiarEstado(datos);
        });
      }}
    >
      {ESTADOS.map(([valor, nombre]) => (
        <option key={valor} value={valor}>
          {nombre}
        </option>
      ))}
    </select>
  );
}
