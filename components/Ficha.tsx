import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Dibujo, agotado, enOferta, rutaProducto, type Producto } from "@/lib/productos";
import { BotonSumar } from "./BotonSumar";
import { Precio } from "./Precio";

/* El sello de la esquina: lo más urgente primero. */
export function sello(p: Producto) {
  if (agotado(p)) return { texto: "Sin stock", clase: "sello--agotado" };
  if (enOferta(p)) return { texto: `Oferta −${Math.round((1 - p.precio / p.precioAnterior!) * 100)}%`, clase: "sello--oferta" };
  if (p.stock !== undefined && p.stock <= 3) return { texto: p.stock === 1 ? "¡Queda 1!" : `Quedan ${p.stock}`, clase: "sello--pocos" };
  return null;
}

/* orden: la posición en la grilla, para escalonar la entrada. */
export function Ficha({ producto: p, orden = 0 }: { producto: Producto; orden?: number }) {
  const ruta = rutaProducto(p.id);
  const marca = sello(p);
  return (
    <article className={`ficha${agotado(p) ? " ficha--agotada" : ""}`} style={{ "--n": orden % 8 } as CSSProperties}>
      {/* El enlace para lectores y teclado es el del título; este repite el destino para el mouse. */}
      <Link
        className="ficha__dibujo"
        href={ruta}
        tabIndex={-1}
        aria-hidden="true"
        style={{ "--fondo": `var(--color-${p.color}-suave)` } as CSSProperties}
      >
        {p.fotos?.[0] ? (
          <Image src={p.fotos[0]} alt="" fill sizes="(min-width: 52rem) 16rem, 50vw" />
        ) : (
          <Dibujo nombre={p.dibujo} color={p.color} />
        )}
      </Link>
      {marca && <span className={`sello ${marca.clase}`}>{marca.texto}</span>}
      {p.tipo === "descargable" && <span className="ficha__etiqueta">Llega por mail</span>}
      <h3>
        <Link href={ruta}>{p.nombre}</Link>
      </h3>
      {p.detalle && <p className="ficha__detalle">{p.detalle}</p>}
      <p className="ficha__desc">{p.desc}</p>
      {p.porCantidad && (
        <p className="ficha__cantidad">
          Llevando {p.porCantidad[0].cantidad}: {p.porCantidad[0].descuento} % off
        </p>
      )}
      {p.contenido && (
        <ul className="ficha__contenido">
          {p.contenido.map((cosa) => (
            <li key={cosa}>{cosa}</li>
          ))}
        </ul>
      )}
      <div className="ficha__pie">
        <Precio producto={p} className="ficha__precio" />
        <BotonSumar id={p.id} nombre={p.nombre} agotado={agotado(p)} />
      </div>
    </article>
  );
}
