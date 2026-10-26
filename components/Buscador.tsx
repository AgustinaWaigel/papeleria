"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { normalizar, type Producto } from "@/lib/productos";
import { Ficha } from "./Ficha";

export function Buscador({ productos, etiquetas }: { productos: Producto[]; etiquetas: Record<string, string> }) {
  const [busqueda, setBusqueda] = useState(useSearchParams().get("q") ?? "");
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);

  // Cada producto se busca por todo lo que lo describe; tienen que aparecer todas las palabras.
  const resultados = palabras.length
    ? productos.filter((p) => {
        const pajar = normalizar(
          [p.nombre, p.desc, p.detalle, etiquetas[p.tipo], p.cat && etiquetas[p.cat], ...(p.contenido ?? []), ...(p.etiquetas ?? [])].join(" "),
        );
        return palabras.every((palabra) => pajar.includes(palabra));
      })
    : [];

  function escribir(valor: string) {
    setBusqueda(valor);
    // La búsqueda queda en la dirección, para compartirla o volver con "atrás".
    const url = new URL(window.location.href);
    if (valor.trim()) url.searchParams.set("q", valor.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }

  return (
    <>
      <form className="buscador" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="sr-only" htmlFor="buscador-q">
          Buscar productos
        </label>
        <input
          type="search"
          id="buscador-q"
          placeholder="Cuaderno, stickers, planner…"
          autoFocus
          autoComplete="off"
          value={busqueda}
          onChange={(e) => escribir(e.target.value)}
        />
      </form>
      <p className="catalogo__cuenta" aria-live="polite">
        {palabras.length === 0
          ? `Escribí qué buscás: hay ${productos.length} productos.`
          : resultados.length === 0
            ? "No encontramos nada con eso. Probá con otra palabra."
            : `${resultados.length} ${resultados.length === 1 ? "producto" : "productos"}`}
      </p>
      <div className="grilla-fichas grilla-fichas--barajar" key={palabras.join(" ")}>
        {resultados.map((p, n) => (
          <Ficha key={p.id} producto={p} orden={n} />
        ))}
      </div>
    </>
  );
}
