"use client";

import Link from "next/link";
import { useState } from "react";
import { enlaceWhatsApp, precio } from "@/lib/contacto";
import { leerLista, type ProductoLista } from "@/lib/listas";
import { agotado, precioUnitario, rutaProducto, type Escala } from "@/lib/productos";
import { useAccionesBolsita } from "./Bolsita";

export type ProductoParaLista = ProductoLista & { precio: number; porCantidad?: Escala[]; stock?: number };

type Fila = { original: string; cantidad: number; opciones: string[]; elegido: string };

const EJEMPLO = `2 cuadernos tapa dura A4 rayados
1 carpeta N°3 con elástico
Lápices de colores x 12
3 lápices negros
Goma de borrar
Stickers para decorar`;

/* "Listas escolares": se pega la lista de útiles, se elige qué producto va en cada renglón y se suma todo a la
   bolsita de una vez, multiplicado por la cantidad de chicos (con el precio por cantidad si corresponde). */
export function ListaEscolar({ productos }: { productos: ProductoParaLista[] }) {
  const { sumar } = useAccionesBolsita();
  const [lista, setLista] = useState("");
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [chicos, setChicos] = useState("1");
  const porId = new Map(productos.map((p) => [p.id, p]));
  const veces = Math.min(Math.max(Number(chicos) || 1, 1), 60);

  const armar = () =>
    setFilas(leerLista(lista, productos).map((r) => ({ ...r, elegido: r.opciones.find((id) => !agotado(porId.get(id)!)) ?? "" })));
  const cambiar = (n: number, cambios: Partial<Fila>) => setFilas((lista) => lista?.map((f, i) => (i === n ? { ...f, ...cambios } : f)) ?? null);

  // Lo que se suma, agrupado por producto (dos renglones pueden ser el mismo).
  const porProducto = new Map<string, number>();
  for (const f of filas ?? []) if (f.elegido) porProducto.set(f.elegido, (porProducto.get(f.elegido) ?? 0) + f.cantidad * veces);
  const total = [...porProducto].reduce((s, [id, cantidad]) => s + precioUnitario(porId.get(id)!, cantidad) * cantidad, 0);
  const faltan = (filas ?? []).filter((f) => !f.elegido);

  if (!filas) {
    return (
      <div className="lista-escolar">
        <label htmlFor="lista-texto" className="lista-escolar__titulo">
          Pegá la lista acá (un útil por renglón)
        </label>
        <textarea
          id="lista-texto"
          rows={10}
          value={lista}
          placeholder={EJEMPLO}
          onChange={(e) => setLista(e.target.value)}
        />
        <div className="fila-botones">
          <button className="boton" type="button" disabled={!lista.trim()} onClick={armar}>
            Buscar en la tienda
          </button>
          {!lista.trim() && (
            <button className="boton boton--claro" type="button" onClick={() => setLista(EJEMPLO)}>
              Probar con un ejemplo
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="lista-escolar">
      <ul className="lista-escolar__filas">
        {filas.map((f, n) => {
          const p = porId.get(f.elegido);
          return (
            <li key={n} className={f.elegido ? undefined : "lista-escolar__falta"}>
              <span className="lista-escolar__original">{f.original}</span>
              <select
                aria-label={`Producto para «${f.original}»`}
                value={f.elegido}
                onChange={(e) => cambiar(n, { elegido: e.target.value })}
              >
                <option value="">{f.opciones.length ? "No lo sumo" : "No lo encontramos"}</option>
                {/* Primero los parecidos; después, todo el catálogo para elegir a mano. */}
                {f.opciones.map((id) => (
                  <option key={id} value={id} disabled={agotado(porId.get(id)!)}>
                    {porId.get(id)!.nombre}
                    {agotado(porId.get(id)!) ? " (sin stock)" : ""}
                  </option>
                ))}
                <optgroup label="Otro producto">
                  {productos
                    .filter((o) => !f.opciones.includes(o.id) && !agotado(o))
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nombre}
                      </option>
                    ))}
                </optgroup>
              </select>
              <label className="lista-escolar__cantidad">
                <span className="sr-only">Cantidad de «{f.original}»</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={f.cantidad}
                  onChange={(e) => cambiar(n, { cantidad: Math.min(Math.max(Number(e.target.value) || 1, 1), 99) })}
                />
              </label>
              {p && (
                <Link className="lista-escolar__ver" href={rutaProducto(p.id)} target="_blank">
                  Ver
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <div className="lista-escolar__pie">
        <label className="lista-escolar__chicos">
          <span>¿Para cuántos chicos?</span>
          <input type="number" min={1} max={60} value={chicos} onChange={(e) => setChicos(e.target.value)} />
        </label>
        <p className="bolsita__total">
          Total estimado <span>{precio(total)}</span>
        </p>
        <p className="campo__ayuda">Si llevás varios del mismo, el precio por cantidad se aplica solo. Al pagar se confirma el precio.</p>
        <div className="fila-botones">
          <button
            className="boton"
            type="button"
            disabled={porProducto.size === 0}
            onClick={() => porProducto.forEach((cantidad, id) => sumar(id, cantidad))}
          >
            Sumar todo a la bolsita
          </button>
          <button className="boton boton--claro" type="button" onClick={() => setFilas(null)}>
            Cambiar la lista
          </button>
        </div>
        {faltan.length > 0 && (
          <p className="lista-escolar__faltan">
            Hay {faltan.length === 1 ? "un útil que no sumaste" : `${faltan.length} útiles que no sumaste`}.{" "}
            <a
              href={enlaceWhatsApp(
                `¡Hola! Estoy armando la lista del cole${veces > 1 ? ` para ${veces} chicos` : ""} y no encontré:\n${faltan.map((f) => `• ${f.cantidad} × ${f.original}`).join("\n")}\n¿Lo tienen o lo pueden conseguir?`,
              )}
              target="_blank"
              rel="noopener"
            >
              Preguntanos por WhatsApp
            </a>{" "}
            y te decimos si lo conseguimos.
          </p>
        )}
      </div>
    </div>
  );
}
