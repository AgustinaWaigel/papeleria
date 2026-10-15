"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { alternar, borrarProducto } from "@/app/admin/acciones";
import { precio } from "@/lib/contacto";
import { Dibujo, TIPOS, enOferta, type Producto } from "@/lib/productos";

type ProductoAdmin = Producto & { activo: boolean };

function Interruptor({ id, campo, valor, etiqueta }: { id: string; campo: string; valor: boolean; etiqueta: string }) {
  return (
    <form action={alternar}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="campo" value={campo} />
      <input type="hidden" name="valor" value={String(!valor)} />
      <button className="interruptor" type="submit" role="switch" aria-checked={valor} aria-label={etiqueta}>
        <span />
      </button>
    </form>
  );
}

export function TablaProductos({ productos }: { productos: ProductoAdmin[] }) {
  const [tipo, setTipo] = useState("todo");
  const [busqueda, setBusqueda] = useState("");
  const termino = busqueda.trim().toLowerCase();
  const visibles = productos.filter(
    (p) => (tipo === "todo" || p.tipo === tipo) && (!termino || `${p.nombre} ${p.id}`.toLowerCase().includes(termino)),
  );

  return (
    <>
      <div className="admin__herramientas">
        <div className="filtros" role="group" aria-label="Filtrar por sección">
          {[["todo", "Todo"], ...TIPOS].map(([id, nombre]) => (
            <button key={id} className="filtro" type="button" aria-pressed={tipo === id} onClick={() => setTipo(id)}>
              {nombre} <span className="admin__cuenta">{id === "todo" ? productos.length : productos.filter((p) => p.tipo === id).length}</span>
            </button>
          ))}
        </div>
        <div className="campo admin__buscar">
          <label className="solo-lectores" htmlFor="buscar">
            Buscar
          </label>
          <input type="text" id="buscar" placeholder="Buscar por nombre…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div className="admin__tabla-marco">
        <table className="admin__tabla">
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col">Sección</th>
              <th scope="col">Precio</th>
              <th scope="col">Stock</th>
              <th scope="col">En la tienda</th>
              <th scope="col">En Inicio</th>
              <th scope="col">
                <span className="solo-lectores">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((p, n) => (
              <tr key={p.id} className={p.activo ? undefined : "admin__oculto"} style={{ "--n": n % 12 } as CSSProperties}>
                <td>
                  <div className="admin__producto">
                    <span className="admin__miniatura" style={{ "--fondo": `var(--color-${p.color}-suave)` } as CSSProperties}>
                      {p.fotos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element -- miniatura chica del panel
                        <img src={p.fotos[0]} alt="" />
                      ) : (
                        <Dibujo nombre={p.dibujo} color={p.color} />
                      )}
                    </span>
                    <span>
                      <strong>{p.nombre}</strong>
                      <small>{p.id}</small>
                    </span>
                  </div>
                </td>
                <td>{TIPOS.find(([t]) => t === p.tipo)?.[1]}</td>
                <td className="admin__precio">
                  {precio(p.precio)}
                  {enOferta(p) && <small className="admin__oferta"> oferta</small>}
                </td>
                <td className={p.stock === 0 ? "admin__sin-stock" : undefined}>{p.stock ?? "—"}</td>
                <td>
                  <Interruptor id={p.id} campo="activo" valor={p.activo} etiqueta={`Mostrar ${p.nombre} en la tienda`} />
                </td>
                <td>
                  <Interruptor id={p.id} campo="destacado" valor={Boolean(p.destacado)} etiqueta={`Destacar ${p.nombre} en Inicio`} />
                </td>
                <td>
                  <div className="admin__acciones">
                    <Link className="boton boton--claro boton--chico" href={`/admin/productos/${p.id}`}>
                      Editar
                    </Link>
                    <form
                      action={borrarProducto}
                      onSubmit={(e) => {
                        if (!confirm(`¿Borrar «${p.nombre}»? No se puede deshacer.`)) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <button className="admin__borrar" type="submit">
                        Borrar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && <p className="admin__vacio">No hay productos que coincidan.</p>}
      </div>
    </>
  );
}
