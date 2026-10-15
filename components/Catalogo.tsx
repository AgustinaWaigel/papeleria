"use client";

import { useState } from "react";
import type { Producto } from "@/lib/productos";
import { Ficha } from "./Ficha";

/* Recibe los productos de un tipo y sus categorías desde el servidor (ver components/Estanteria.tsx). */
export function Catalogo({ productos, categorias }: { productos: Producto[]; categorias: [id: string, nombre: string][] }) {
  const [filtro, setFiltro] = useState("todo");
  const visibles = filtro === "todo" ? productos : productos.filter((p) => p.cat === filtro);

  return (
    <>
      {categorias.length > 0 && (
        <>
          <div className="filtros" role="group" aria-label="Filtrar por categoría">
            {[["todo", "Todo"], ...categorias].map(([id, nombre]) => (
              <button key={id} className="filtro" type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
                {nombre}
              </button>
            ))}
          </div>
          <p className="catalogo__cuenta" aria-live="polite">
            {visibles.length} {visibles.length === 1 ? "producto" : "productos"}
          </p>
        </>
      )}
      {/* La key rearma la grilla al cambiar de filtro: las fichas entran de nuevo, escalonadas. */}
      <div className="grilla-fichas grilla-fichas--barajar" key={filtro}>
        {visibles.map((p, n) => (
          <Ficha key={p.id} producto={p} orden={n} />
        ))}
      </div>
      {visibles.length === 0 && <p className="catalogo__cuenta">Por ahora no hay productos acá. Volvé pronto.</p>}
    </>
  );
}
