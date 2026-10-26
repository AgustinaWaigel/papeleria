"use client";

import { startTransition, useActionState, useState } from "react";
import { subirFotoClienta } from "@/app/admin/tienda-acciones";
import { achicarFotosDe } from "@/lib/fotos";

/* Subir fotos de clientas: la foto, quién la sacó y en qué producto se muestra. */
export function FormFotoClienta({ productos }: { productos: [id: string, nombre: string][] }) {
  const [estado, accion, enviando] = useActionState(subirFotoClienta, undefined);
  const [achicando, setAchicando] = useState(false);

  return (
    <form
      className="admin__grupo"
      onSubmit={async (e) => {
        e.preventDefault();
        const formulario = e.currentTarget;
        const datos = new FormData(formulario);
        setAchicando(true);
        await achicarFotosDe(datos, ["foto"]);
        setAchicando(false);
        startTransition(() => accion(datos));
        formulario.reset();
      }}
    >
      <h2 className="admin__subtitulo">Sumar fotos</h2>
      <div className="campo">
        <label htmlFor="c-foto">Fotos</label>
        <input type="file" id="c-foto" name="foto" accept="image/jpeg,image/png,image/webp,image/avif" multiple required />
      </div>
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="c-autora">Quién la sacó</label>
          <input type="text" id="c-autora" name="autora" placeholder="@usuaria o un nombre" />
        </div>
        <div className="campo">
          <label htmlFor="c-producto">Producto que se ve</label>
          <select id="c-producto" name="producto" defaultValue="">
            <option value="">Ninguno en especial (solo en Inicio)</option>
            {productos.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
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
      <button className="boton" type="submit" disabled={enviando || achicando}>
        {achicando ? "Preparando las fotos…" : enviando ? "Subiendo…" : "Subir"}
      </button>
    </form>
  );
}
