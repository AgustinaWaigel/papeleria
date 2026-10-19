"use client";

import { useActionState, useState } from "react";
import { crearCupon } from "@/app/admin/tienda-acciones";

/* Un cupón nuevo: código, cuánto descuenta y sus límites (todos opcionales). */
export function FormCupon() {
  const [estado, accion, creando] = useActionState(crearCupon, undefined);
  const [tipo, setTipo] = useState("porcentaje");

  return (
    <form action={accion} className="admin__grupo" key={estado?.ok}>
      <h2 className="admin__subtitulo">Cupón nuevo</h2>
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="c-codigo">Código</label>
          <input type="text" id="c-codigo" name="codigo" required maxLength={30} placeholder="BIENVENIDA10" style={{ textTransform: "uppercase" }} />
        </div>
        <div className="campo">
          <label htmlFor="c-tipo">Descuenta</label>
          <select id="c-tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="porcentaje">Un porcentaje (%)</option>
            <option value="monto">Un monto fijo ($)</option>
          </select>
        </div>
      </div>
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="c-valor">{tipo === "porcentaje" ? "Porcentaje (1 a 100)" : "Monto en pesos"}</label>
          <input type="text" inputMode="numeric" id="c-valor" name="valor" required />
        </div>
        <div className="campo">
          <label htmlFor="c-minimo">Compra mínima (opcional)</label>
          <input type="text" inputMode="numeric" id="c-minimo" name="minimo" placeholder="Sin mínimo" />
        </div>
      </div>
      <div className="editor__par">
        <div className="campo">
          <label htmlFor="c-vence">Vence (opcional)</label>
          <input type="date" id="c-vence" name="vence" />
        </div>
        <div className="campo">
          <label htmlFor="c-usos">Cuántas veces se puede usar (opcional)</label>
          <input type="text" inputMode="numeric" id="c-usos" name="usos_max" placeholder="Sin límite" />
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
      <button className="boton" type="submit" disabled={creando}>
        {creando ? "Creando…" : "Crear cupón"}
      </button>
    </form>
  );
}
