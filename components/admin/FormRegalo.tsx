"use client";

import { useActionState } from "react";
import { guardarRegalo } from "@/app/admin/tienda-acciones";

/* Qué descargable le llega de regalo a quien se anota en las novedades. */
export function FormRegalo({ descargables, actual }: { descargables: [id: string, nombre: string][]; actual: string | null }) {
  const [estado, accion, guardando] = useActionState(guardarRegalo, undefined);

  return (
    <form action={accion} className="admin__grupo">
      <h2 className="admin__subtitulo">Regalo al anotarse</h2>
      <p className="campo__ayuda">
        Elegí un descargable: a quien se suscribe le llega por mail con un botón para bajarlo, y el formulario del pie lo
        anuncia. Solo aparecen los descargables que tienen el PDF cargado.
      </p>
      <div className="categoria__fila">
        <label className="categoria__nombre">
          <span className="sr-only">Descargable de regalo</span>
          <select name="producto" defaultValue={actual ?? ""}>
            <option value="">Sin regalo</option>
            {descargables.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <button className="boton boton--chico" type="submit" disabled={guardando}>
          Guardar
        </button>
      </div>
      {estado?.error && (
        <p className="admin__error" role="alert">
          {estado.error}
        </p>
      )}
      {estado?.ok && (
        <p className="admin__exito" role="status">
          {estado.ok}
        </p>
      )}
    </form>
  );
}
