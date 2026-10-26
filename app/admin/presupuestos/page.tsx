import type { Metadata } from "next";
import { Suspense } from "react";
import { atenderPresupuesto, borrarPresupuesto } from "../tienda-acciones";
import { BotonConfirmar } from "@/components/admin/BotonConfirmar";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { TIPOS_PRESUPUESTO } from "@/lib/contacto";
import { whatsappDe } from "@/lib/pedidos";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Presupuestos" };

type Presupuesto = {
  id: number;
  codigo: string;
  nombre: string;
  email: string;
  telefono: string | null;
  tipo: string;
  organizacion: string | null;
  detalle: string;
  fecha: string | null;
  estado: "nuevo" | "atendido";
  creado_en: string;
};

async function Contenido() {
  const { supabase } = await exigirAdmin();
  const { data, error } = await supabase.from("presupuestos").select("*").order("creado_en", { ascending: false });
  const lista = (data ?? []) as Presupuesto[];

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">pedidos por mayor</span>
          <h1>Presupuestos</h1>
        </div>
      </div>
      {error && <p className="admin__error">No se pudieron leer: {error.message}. ¿Corriste supabase/11-muestras-regalo-fotos-presupuestos.sql?</p>}
      <p className="campo__ayuda mb-e5">
        Llegan desde la página «Pedidos por mayor» de la tienda (emprendimientos, escuelas y eventos). Con el mail
        configurado, también te llega un aviso por cada uno.
      </p>

      <div className="admin__tabla-marco">
        <table className="admin__tabla">
          <thead>
            <tr>
              <th scope="col">Pedido</th>
              <th scope="col">Quién</th>
              <th scope="col">Qué necesita</th>
              <th scope="col">Para cuándo</th>
              <th scope="col">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const whatsapp = whatsappDe(p.telefono);
              return (
                <tr key={p.id} className={p.estado === "atendido" ? "admin__oculto" : undefined}>
                  <td>
                    <strong>{p.codigo}</strong>
                    <br />
                    <small>
                      {TIPOS_PRESUPUESTO.find(([t]) => t === p.tipo)?.[1] ?? p.tipo} ·{" "}
                      {new Date(p.creado_en).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
                    </small>
                  </td>
                  <td>
                    {p.nombre}
                    {p.organizacion && (
                      <>
                        <br />
                        <small>{p.organizacion}</small>
                      </>
                    )}
                    <br />
                    <a href={`mailto:${p.email}?subject=Tu presupuesto ${p.codigo}`}>{p.email}</a>
                    {whatsapp && (
                      <>
                        <br />
                        <a href={whatsapp} target="_blank" rel="noopener">
                          {p.telefono}
                        </a>
                      </>
                    )}
                  </td>
                  <td className="admin__texto-largo">{p.detalle}</td>
                  <td>{p.fecha ?? "—"}</td>
                  <td>
                    <div className="admin__acciones">
                      <form action={atenderPresupuesto}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="atendido" value={String(p.estado !== "atendido")} />
                        <button className="admin__borrar" type="submit">
                          {p.estado === "atendido" ? "Volver a nuevo" : "Marcar atendido"}
                        </button>
                      </form>
                      <form action={borrarPresupuesto}>
                        <input type="hidden" name="id" value={p.id} />
                        <BotonConfirmar pregunta={`¿Borrar el presupuesto ${p.codigo}?`}>Borrar</BotonConfirmar>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {lista.length === 0 && <p className="admin__vacio">Todavía no llegó ninguno.</p>}
      </div>
    </>
  );
}

export default function Presupuestos() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Revisando…</p>}>
      <Contenido />
    </Suspense>
  );
}
