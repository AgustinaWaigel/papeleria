"use client";

import { useState } from "react";
import { precio } from "@/lib/contacto";
import { ahorroPorCantidad, precioUnitario, type Producto } from "@/lib/productos";
import { useAccionesBolsita } from "./Bolsita";

/* En la página de un producto con precio por cantidad: x1, x10, x20… con lo que sale cada unidad y el total. */
export function ElegirCantidad({ producto: p }: { producto: Pick<Producto, "id" | "nombre" | "precio" | "porCantidad"> }) {
  const { sumar } = useAccionesBolsita();
  const [cantidad, setCantidad] = useState(1);
  const escalas = p.porCantidad ?? [];
  const unitario = precioUnitario(p, cantidad);
  const ahorro = ahorroPorCantidad(p, cantidad);

  return (
    <div className="por-cantidad">
      <p className="por-cantidad__titulo" id="por-cantidad">
        ¿Cuántos llevás?
      </p>
      <div className="filtros" role="group" aria-labelledby="por-cantidad">
        {[1, ...escalas.map((e) => e.cantidad)].map((n) => (
          <button key={n} className="filtro" type="button" aria-pressed={cantidad === n} onClick={() => setCantidad(n)}>
            x{n}
            {ahorroPorCantidad(p, n) > 0 && <span className="por-cantidad__off"> −{precio(ahorroPorCantidad(p, n))}</span>}
          </button>
        ))}
      </div>
      <p className="por-cantidad__cuenta">
        {cantidad > 1 && (
          <>
            {cantidad} × {precio(unitario)} ={" "}
          </>
        )}
        <strong>{precio(unitario * cantidad)}</strong>
        {ahorro > 0 && <span className="por-cantidad__ahorro">Ahorrás {precio(ahorro)}</span>}
      </p>
      <button className="boton" type="button" onClick={() => sumar(p.id, cantidad)}>
        {cantidad > 1 ? `Agregar ${cantidad} a la bolsita` : "Agregar a la bolsita"}
      </button>
    </div>
  );
}
