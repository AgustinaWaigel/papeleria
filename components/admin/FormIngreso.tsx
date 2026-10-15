"use client";

import { useActionState } from "react";
import { ingresar } from "@/app/admin/acciones";

export function FormIngreso() {
  const [estado, accion, enviando] = useActionState(ingresar, undefined);

  return (
    <form action={accion}>
      <div className="campo">
        <label htmlFor="ingreso-email">Mail</label>
        <input type="email" id="ingreso-email" name="email" autoComplete="email" required />
      </div>
      <div className="campo">
        <label htmlFor="ingreso-clave">Contraseña</label>
        <input type="password" id="ingreso-clave" name="clave" autoComplete="current-password" required />
      </div>
      {estado?.error && (
        <p className="admin__error" role="alert">
          {estado.error}
        </p>
      )}
      <button className="boton boton--ancho" type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
