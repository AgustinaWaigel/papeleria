"use client";

import { useActionState } from "react";
import { borrarZona, crearZona, guardarZona } from "@/app/admin/tienda-acciones";
import { PROVINCIAS, type Zona } from "@/lib/zonas";
import { BotonConfirmar } from "./BotonConfirmar";

function Aviso({ estado }: { estado: { error?: string; ok?: string } | undefined }) {
  if (estado?.error) return <p className="admin__error" role="alert">{estado.error}</p>;
  if (estado?.ok) return <p className="admin__exito" role="status">{estado.ok}</p>;
  return null;
}

function Renglon({ z, usadas }: { z: Zona; usadas: Map<string, string> }) {
  const [estadoGuardar, guardar, guardando] = useActionState(guardarZona, undefined);
  const [estadoBorrar, borrar] = useActionState(borrarZona, undefined);

  return (
    <li className="zona">
      <form action={guardar}>
        <input type="hidden" name="id" value={z.id} />
        <div className="zona__fila">
          <label className="categoria__nombre">
            <span className="sr-only">Nombre de la zona</span>
            <input type="text" name="nombre" defaultValue={z.nombre} required />
          </label>
          <label className="zona__costo">
            <span>$</span>
            <input type="text" inputMode="numeric" name="costo" defaultValue={z.costo ?? ""} placeholder="por defecto" aria-label={`Costo de ${z.nombre}`} />
          </label>
          <label className="categoria__orden">
            <span>Orden</span>
            <input type="text" inputMode="numeric" name="orden" defaultValue={z.orden} />
          </label>
        </div>
        <fieldset className="zona__provincias">
          <legend className="sr-only">Provincias de {z.nombre}</legend>
          {PROVINCIAS.map(([letra, nombre]) => {
            const otra = usadas.get(letra);
            return (
              <label key={letra} className="zona__provincia" title={otra && otra !== z.nombre ? `También en «${otra}» (gana la de menor orden)` : undefined}>
                <input type="checkbox" name="provincias" value={letra} defaultChecked={z.provincias.includes(letra)} />
                <span>{nombre}</span>
              </label>
            );
          })}
        </fieldset>
        <label className="zona__cps">
          <span>Códigos postales puntuales (ganan sobre la provincia)</span>
          <input type="text" name="codigos_postales" defaultValue={z.codigos_postales.join(", ")} placeholder="Por ejemplo: 3100, 3101" />
        </label>
        <div className="admin__acciones zona__acciones">
          <button className="boton boton--claro boton--chico" type="submit" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          <BotonConfirmar pregunta={`¿Borrar la zona «${z.nombre}»?`} formAction={borrar}>
            Borrar
          </BotonConfirmar>
        </div>
      </form>
      <Aviso estado={estadoBorrar ?? estadoGuardar} />
    </li>
  );
}

/* Las zonas de envío: cada una con su costo, sus provincias y, si hace falta, códigos postales puntuales. */
export function EditorZonas({ zonas }: { zonas: Zona[] }) {
  const [estado, crear, creando] = useActionState(crearZona, undefined);
  // Qué provincia está en qué zona (la primera por orden), para avisar si una está en dos.
  const usadas = new Map<string, string>();
  for (const z of [...zonas].sort((a, b) => a.orden - b.orden)) for (const l of z.provincias) if (!usadas.has(l)) usadas.set(l, z.nombre);
  const sinZona = PROVINCIAS.filter(([l]) => !usadas.has(l));

  return (
    <section className="admin__grupo">
      <h2 className="admin__subtitulo">Zonas</h2>
      <p className="campo__ayuda">
        Quien compra pone su código postal y le cobramos el de su zona. Si un código postal está en una zona, gana sobre la
        provincia. Sin precio, la zona usa el costo por defecto (abajo).
      </p>
      {sinZona.length > 0 && (
        <p className="admin__error">
          Sin zona: {sinZona.map(([, n]) => n).join(", ")}. A estas les cobramos el costo por defecto (o se coordina aparte).
        </p>
      )}
      <ul className="zonas">
        {zonas.map((z) => (
          <Renglon key={z.id} z={z} usadas={usadas} />
        ))}
      </ul>
      <form action={crear} className="categoria__fila categoria__nueva">
        <label className="categoria__nombre">
          <span className="sr-only">Nombre de la zona nueva</span>
          <input type="text" name="nombre" placeholder="Zona nueva…" required />
        </label>
        <button className="boton boton--chico" type="submit" disabled={creando}>
          Agregar
        </button>
      </form>
      <Aviso estado={estado} />
    </section>
  );
}
