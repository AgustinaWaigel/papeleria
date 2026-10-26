"use client";

import { useActionState } from "react";
import { borrarSeccion, crearSeccion, guardarSeccion } from "@/app/admin/tienda-acciones";
import { BotonConfirmar } from "./BotonConfirmar";

export type FilaSeccion = { id: string; nombre: string; descripcion: string | null; orden: number; productos: number };

function Aviso({ estado }: { estado: { error?: string; ok?: string } | undefined }) {
  if (estado?.error) return <p className="admin__error" role="alert">{estado.error}</p>;
  if (estado?.ok) return <p className="admin__exito" role="status">{estado.ok}</p>;
  return null;
}

function Renglon({ s }: { s: FilaSeccion }) {
  const [estadoGuardar, guardar, guardando] = useActionState(guardarSeccion, undefined);
  const [estadoBorrar, borrar] = useActionState(borrarSeccion, undefined);

  return (
    <li className="categoria">
      <form action={guardar} className="categoria__fila">
        <input type="hidden" name="id" value={s.id} />
        <label className="categoria__nombre">
          <span className="sr-only">Nombre</span>
          <input type="text" name="nombre" defaultValue={s.nombre} required />
        </label>
        <label className="categoria__orden">
          <span>Orden</span>
          <input type="text" inputMode="numeric" name="orden" defaultValue={s.orden} />
        </label>
        <a className="admin__dato" href={`/seccion/${s.id}`} target="_blank">
          {s.productos} {s.productos === 1 ? "producto" : "productos"}
        </a>
        <button className="boton boton--claro boton--chico" type="submit" disabled={guardando}>
          Guardar
        </button>
        <BotonConfirmar pregunta={`¿Borrar la sección «${s.nombre}»? Los productos conservan la etiqueta.`} formAction={borrar}>
          Borrar
        </BotonConfirmar>
        <label className="categoria__descripcion">
          <span className="sr-only">Texto de la página</span>
          <input type="text" name="descripcion" defaultValue={s.descripcion ?? ""} placeholder="Texto que aparece arriba en su página (opcional)" />
        </label>
      </form>
      <Aviso estado={estadoBorrar ?? estadoGuardar} />
    </li>
  );
}

export function EditorSecciones({ secciones }: { secciones: FilaSeccion[] }) {
  const [estado, crear, creando] = useActionState(crearSeccion, undefined);

  return (
    <section className="admin__grupo">
      <ul className="categorias">
        {secciones.map((s) => (
          <Renglon key={s.id} s={s} />
        ))}
      </ul>
      <form action={crear} className="categoria__fila categoria__nueva">
        <label className="categoria__nombre">
          <span className="sr-only">Nombre de la sección nueva</span>
          <input type="text" name="nombre" placeholder="Nueva sección… (por ejemplo: Vuelta al cole)" required />
        </label>
        <button className="boton boton--chico" type="submit" disabled={creando}>
          Agregar
        </button>
        <label className="categoria__descripcion">
          <span className="sr-only">Texto de la página</span>
          <input type="text" name="descripcion" placeholder="Texto que aparece arriba en su página (opcional)" />
        </label>
      </form>
      <Aviso estado={estado} />
    </section>
  );
}
