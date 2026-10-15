"use client";

import { useActionState } from "react";
import { borrarCategoria, crearCategoria, guardarCategoria } from "@/app/admin/tienda-acciones";

export type FilaCategoria = { id: string; nombre: string; orden: number; productos: number };

function Aviso({ estado }: { estado: { error?: string; ok?: string } | undefined }) {
  if (estado?.error) return <p className="admin__error" role="alert">{estado.error}</p>;
  if (estado?.ok) return <p className="admin__exito" role="status">{estado.ok}</p>;
  return null;
}

function Renglon({ c }: { c: FilaCategoria }) {
  const [estadoGuardar, guardar, guardando] = useActionState(guardarCategoria, undefined);
  const [estadoBorrar, borrar] = useActionState(borrarCategoria, undefined);

  return (
    <li className="categoria">
      <form action={guardar} className="categoria__fila">
        <input type="hidden" name="id" value={c.id} />
        <label className="categoria__nombre">
          <span className="sr-only">Nombre</span>
          <input type="text" name="nombre" defaultValue={c.nombre} required />
        </label>
        <label className="categoria__orden">
          <span>Orden</span>
          <input type="text" inputMode="numeric" name="orden" defaultValue={c.orden} />
        </label>
        <span className="admin__dato">
          {c.productos} {c.productos === 1 ? "producto" : "productos"}
        </span>
        <button className="boton boton--claro boton--chico" type="submit" disabled={guardando}>
          Guardar
        </button>
        <button
          className="admin__borrar"
          type="submit"
          formAction={borrar}
          onClick={(e) => {
            if (!confirm(`¿Borrar la categoría «${c.nombre}»?`)) e.preventDefault();
          }}
        >
          Borrar
        </button>
      </form>
      <Aviso estado={estadoBorrar ?? estadoGuardar} />
    </li>
  );
}

export function EditorCategorias({ tipo, titulo, categorias }: { tipo: string; titulo: string; categorias: FilaCategoria[] }) {
  const [estado, crear, creando] = useActionState(crearCategoria, undefined);

  return (
    <section className="admin__grupo">
      <h2 className="admin__subtitulo">{titulo}</h2>
      <ul className="categorias">
        {categorias.map((c) => (
          <Renglon key={c.id} c={c} />
        ))}
      </ul>
      <form action={crear} className="categoria__fila categoria__nueva">
        <input type="hidden" name="tipo" value={tipo} />
        <label className="categoria__nombre">
          <span className="sr-only">Nombre de la categoría nueva</span>
          <input type="text" name="nombre" placeholder="Nueva categoría…" required />
        </label>
        <button className="boton boton--chico" type="submit" disabled={creando}>
          Agregar
        </button>
      </form>
      <Aviso estado={estado} />
    </section>
  );
}
