"use client";

import { useActionState } from "react";
import { guardarCaja, probarCorreo } from "@/app/admin/tienda-acciones";

type Caja = { caja_alto: number; caja_ancho: number; caja_largo: number; peso_por_defecto: number; envio_recargo: number };

function Aviso({ estado }: { estado: { error?: string; ok?: string } | undefined }) {
  if (estado?.error) return <p className="admin__error" role="alert">{estado.error}</p>;
  if (estado?.ok) return <p className="admin__exito" role="status">{estado.ok}</p>;
  return null;
}

/* Correo Argentino: la caja con la que se cotiza y un botón para probar la conexión. */
export function FormCorreo({ conectado, ambiente, caja }: { conectado: boolean; ambiente: string; caja: Caja }) {
  const [estadoCaja, guardar, guardando] = useActionState(guardarCaja, undefined);
  const [estadoPrueba, probar, probando] = useActionState(probarCorreo, undefined);

  return (
    <section className="admin__grupo">
      <h2 className="admin__subtitulo">Correo Argentino</h2>
      <p className={conectado ? "admin__exito" : "campo__ayuda"}>
        {conectado
          ? `Conectado (ambiente de ${ambiente}). Quien compra ve la cotización real de su envío; si el correo no responde, se usa el precio de la zona.`
          : "Sin conectar: el envío sale de las zonas. Para cotizar en vivo, cargá las credenciales de la API MiCorreo (ver supabase/LEEME.md)."}
      </p>

      <form action={guardar}>
        <p className="campo__ayuda">La caja o sobre que usás normalmente, en centímetros. El peso sale de cada producto.</p>
        <div className="zona__fila">
          {(
            [
              ["caja_alto", "Alto"],
              ["caja_ancho", "Ancho"],
              ["caja_largo", "Largo"],
            ] as const
          ).map(([nombre, etiqueta]) => (
            <label key={nombre} className="zona__costo">
              <span>{etiqueta}</span>
              <input type="text" inputMode="numeric" name={nombre} defaultValue={caja[nombre]} />
            </label>
          ))}
        </div>
        <div className="editor__par mt-e4">
          <div className="campo">
            <label htmlFor="c-peso">Peso por defecto de un producto (gramos)</label>
            <input type="text" inputMode="numeric" id="c-peso" name="peso_por_defecto" defaultValue={caja.peso_por_defecto} />
            <span className="campo__ayuda">Para los productos sin peso cargado.</span>
          </div>
          <div className="campo">
            <label htmlFor="c-recargo">Recargo sobre la cotización (pesos)</label>
            <input type="text" inputMode="numeric" id="c-recargo" name="envio_recargo" defaultValue={caja.envio_recargo} />
            <span className="campo__ayuda">Embalaje, viaje a la sucursal… Se suma a lo que cobra el correo.</span>
          </div>
        </div>
        <Aviso estado={estadoCaja} />
        <button className="boton boton--claro" type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar la caja"}
        </button>
      </form>

      {conectado && (
        <form action={probar} className="categoria__fila categoria__nueva mt-e4">
          <label className="categoria__nombre">
            <span className="sr-only">Código postal para probar</span>
            <input type="text" name="cp" placeholder="Código postal (por ejemplo, 1425)" maxLength={8} required />
          </label>
          <button className="boton boton--chico" type="submit" disabled={probando}>
            {probando ? "Preguntando…" : "Probar cotización"}
          </button>
        </form>
      )}
      <Aviso estado={estadoPrueba} />
    </section>
  );
}
