"use client";

import { useActionState } from "react";
import { importarExcel } from "@/app/admin/acciones";

/* Exportar e importar el catálogo en Excel, arriba de la lista de productos. */
export function CargaExcel({ hayProductos }: { hayProductos: boolean }) {
  const [estado, accion, enviando] = useActionState(importarExcel, undefined);

  return (
    <details className="excel" open={!hayProductos || undefined}>
      <summary>Cargar o descargar productos con Excel</summary>
      <div className="excel__cuerpo">
        <div>
          <h2>1. Descargá la planilla</h2>
          <p className="campo__ayuda">
            {hayProductos
              ? "Trae todos los productos, también los ocultos. Sirve como respaldo y para editar muchos de una vez."
              : "Todavía no hay productos: baja vacía, con los títulos de las columnas y una hoja que explica qué va en cada una."}
          </p>
          {/* Un <a> común y no <Link>: es una descarga, no una página. */}
          <a className="boton boton--claro boton--chico" href="/admin/exportar" download>
            Descargar Excel
          </a>
        </div>
        <form action={accion}>
          <h2>2. Subila con los cambios</h2>
          <p className="campo__ayuda">
            Los productos con un identificador que ya existe se actualizan; los demás se agregan. Lo que no esté en la
            planilla no se toca.
          </p>
          <div className="excel__subir">
            <input type="file" name="archivo" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required aria-label="Archivo de Excel" />
            <button className="boton boton--chico" type="submit" disabled={enviando}>
              {enviando ? "Cargando…" : "Cargar productos"}
            </button>
          </div>
        </form>
      </div>
      {estado?.ok && (
        <p className="admin__exito" role="status">
          {estado.ok}
        </p>
      )}
      {estado?.error && (
        <div className="admin__error" role="alert">
          <p>{estado.error}</p>
          {estado.detalles && (
            <ul className="excel__errores">
              {estado.detalles.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </details>
  );
}
