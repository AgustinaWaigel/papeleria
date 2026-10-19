import type { Metadata } from "next";
import { Suspense } from "react";
import { alternarCupon, borrarCupon } from "../tienda-acciones";
import { BotonConfirmar } from "@/components/admin/BotonConfirmar";
import { FormCupon } from "@/components/admin/FormCupon";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { precio } from "@/lib/contacto";
import { fechaLinda, hoyEnArgentina } from "@/lib/pedidos";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Cupones" };

type Cupon = { codigo: string; tipo: "porcentaje" | "monto"; valor: number; minimo: number; vence: string | null; usos_max: number | null; usos: number; activo: boolean };

async function Contenido() {
  const { supabase } = await exigirAdmin();
  const { data, error } = await supabase.from("cupones").select("*").order("creado_en", { ascending: false });
  const cupones = (data ?? []) as Cupon[];
  const hoy = hoyEnArgentina();

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">una ayudita para comprar</span>
          <h1>Cupones</h1>
        </div>
      </div>
      {error && <p className="admin__error">No se pudieron leer: {error.message}. ¿Corriste supabase/07-envios-cupones-y-mas.sql?</p>}
      <p className="campo__ayuda mb-e5">
        Quien compra online escribe el código en la bolsita y el descuento se aplica antes de pagar. Un uso se cuenta cuando
        el pago se aprueba. Se usa un cupón por compra.
      </p>

      <div className="editor__campos mb-e5">
        <FormCupon />
      </div>

      <div className="admin__tabla-marco">
        <table className="admin__tabla">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Descuento</th>
              <th scope="col">Condiciones</th>
              <th scope="col">Usos</th>
              <th scope="col">Estado</th>
              <th scope="col">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {cupones.map((c) => {
              const vencido = c.vence !== null && c.vence < hoy;
              const agotado = c.usos_max !== null && c.usos >= c.usos_max;
              return (
                <tr key={c.codigo} className={!c.activo || vencido || agotado ? "admin__oculto" : undefined}>
                  <td>
                    <strong>{c.codigo}</strong>
                  </td>
                  <td>{c.tipo === "porcentaje" ? `${c.valor}%` : precio(c.valor)}</td>
                  <td>
                    {[c.minimo > 0 && `desde ${precio(c.minimo)}`, c.vence && `hasta el ${fechaLinda(c.vence, true)}`].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td>
                    {c.usos}
                    {c.usos_max !== null && ` de ${c.usos_max}`}
                  </td>
                  <td>{vencido ? "Vencido" : agotado ? "Agotado" : c.activo ? "Activo" : "Pausado"}</td>
                  <td>
                    <div className="admin__acciones">
                      <form action={alternarCupon}>
                        <input type="hidden" name="codigo" value={c.codigo} />
                        <input type="hidden" name="activo" value={String(!c.activo)} />
                        <button className="admin__borrar" type="submit">
                          {c.activo ? "Pausar" : "Activar"}
                        </button>
                      </form>
                      <form action={borrarCupon}>
                        <input type="hidden" name="codigo" value={c.codigo} />
                        <BotonConfirmar pregunta={`¿Borrar el cupón ${c.codigo}?`}>Borrar</BotonConfirmar>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {cupones.length === 0 && <p className="admin__vacio">Todavía no hay cupones.</p>}
      </div>
    </>
  );
}

export default function Cupones() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Buscando cupones…</p>}>
      <Contenido />
    </Suspense>
  );
}
