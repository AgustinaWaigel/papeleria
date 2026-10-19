import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { atenderArrepentimiento, borrarArrepentimiento } from "../tienda-acciones";
import { BotonConfirmar } from "@/components/admin/BotonConfirmar";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { whatsappDe } from "@/lib/pedidos";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Arrepentimientos" };

type Arrepentimiento = {
  id: number;
  codigo: string;
  nombre: string;
  email: string;
  telefono: string | null;
  pedido: string | null;
  motivo: string | null;
  estado: "nuevo" | "atendido";
  creado_en: string;
};

async function Contenido() {
  const { supabase } = await exigirAdmin();
  const [{ data, error }, { data: pedidos }] = await Promise.all([
    supabase.from("arrepentimientos").select("*").order("creado_en", { ascending: false }),
    supabase.from("pedidos").select("id, codigo"),
  ]);
  const lista = (data ?? []) as Arrepentimiento[];
  const idDe = new Map((pedidos ?? []).map((p) => [p.codigo, p.id]));

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">botón de arrepentimiento</span>
          <h1>Arrepentimientos</h1>
        </div>
      </div>
      {error && <p className="admin__error">No se pudieron leer: {error.message}. ¿Corriste supabase/07-envios-cupones-y-mas.sql?</p>}
      <p className="campo__ayuda mb-e5">
        Llegan desde el botón del pie de la tienda. Quien lo pide ya recibió su código de trámite por mail. Hay que
        escribirle dentro de las 24 horas para coordinar la devolución (el envío de vuelta corre por tu cuenta) y devolverle
        el dinero por el mismo medio con el que pagó.
      </p>

      <div className="admin__tabla-marco">
        <table className="admin__tabla">
          <thead>
            <tr>
              <th scope="col">Trámite</th>
              <th scope="col">Quién</th>
              <th scope="col">Pedido</th>
              <th scope="col">Motivo</th>
              <th scope="col">Estado</th>
              <th scope="col">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.map((a) => {
              const whatsapp = whatsappDe(a.telefono);
              const pedidoId = a.pedido ? idDe.get(a.pedido) : undefined;
              return (
                <tr key={a.id} className={a.estado === "atendido" ? "admin__oculto" : undefined}>
                  <td>
                    <strong>{a.codigo}</strong>
                    <br />
                    <small>{new Date(a.creado_en).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" })}</small>
                  </td>
                  <td>
                    {a.nombre}
                    <br />
                    <a href={`mailto:${a.email}?subject=Tu pedido de arrepentimiento ${a.codigo}`}>{a.email}</a>
                    {whatsapp && (
                      <>
                        <br />
                        <a href={whatsapp} target="_blank" rel="noopener">
                          {a.telefono}
                        </a>
                      </>
                    )}
                  </td>
                  <td>{pedidoId ? <Link href={`/admin/pedidos/${pedidoId}`}>{a.pedido}</Link> : (a.pedido ?? "—")}</td>
                  <td>{a.motivo ?? "—"}</td>
                  <td>{a.estado === "atendido" ? "Atendido" : "Nuevo"}</td>
                  <td>
                    <div className="admin__acciones">
                      <form action={atenderArrepentimiento}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="atendido" value={String(a.estado !== "atendido")} />
                        <button className="admin__borrar" type="submit">
                          {a.estado === "atendido" ? "Volver a nuevo" : "Marcar atendido"}
                        </button>
                      </form>
                      <form action={borrarArrepentimiento}>
                        <input type="hidden" name="id" value={a.id} />
                        <BotonConfirmar pregunta={`¿Borrar el trámite ${a.codigo}?`}>Borrar</BotonConfirmar>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {lista.length === 0 && <p className="admin__vacio">Nadie pidió cancelar una compra. ¡Bien!</p>}
      </div>
    </>
  );
}

export default function Arrepentimientos() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Revisando…</p>}>
      <Contenido />
    </Suspense>
  );
}
