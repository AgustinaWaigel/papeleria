import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { borrarPedido } from "../acciones";
import { BotonConfirmar } from "@/components/admin/BotonConfirmar";
import { FormDatosPedido } from "@/components/admin/FormDatosPedido";
import { SelectorEstado } from "@/components/admin/SelectorEstado";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { precio } from "@/lib/contacto";
import { CONFIRMADOS, fechaLinda, whatsappDe, type Pedido } from "@/lib/pedidos";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Pedido" };

async function Detalle({ params }: Pick<PageProps<"/admin/pedidos/[id]">, "params">) {
  const { supabase } = await exigirAdmin();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const { data } = await supabase.from("pedidos").select("*, pedido_items(*)").eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const p = data as Pedido;
  const whatsapp = whatsappDe(p.cliente_contacto);

  return (
    <>
      <Link className="producto__volver" href="/admin/pedidos">
        ← Volver a pedidos
      </Link>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">
            {p.origen === "web" ? "pedido de la web" : "venta directa"} · {fechaLinda(p.fecha, true)}
          </span>
          <h1>{p.codigo}</h1>
        </div>
        <SelectorEstado id={p.id} estado={p.estado} />
      </div>

      <div className="editor">
        <div className="editor__campos">
          <section className="admin__grupo">
            <h2 className="admin__subtitulo">Qué lleva</h2>
            <table className="admin__tabla">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Precio c/u</th>
                  <th scope="col">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {p.pedido_items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.producto_id ? <Link href={`/admin/productos/${i.producto_id}`}>{i.nombre}</Link> : i.nombre}</td>
                    <td>{i.cantidad}</td>
                    <td className="admin__precio">{precio(i.precio_unitario)}</td>
                    <td className="admin__precio">{precio(i.precio_unitario * i.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={3}>
                    Total
                  </th>
                  <td className="admin__precio">{precio(p.total)}</td>
                </tr>
              </tfoot>
            </table>
            <p className="campo__ayuda mt-e4">
              {CONFIRMADOS.includes(p.estado)
                ? "Confirmado: el stock de estos productos ya se descontó."
                : "Sin descontar del stock: se descuenta cuando lo pasás a pagado, enviado o entregado."}
            </p>
          </section>

          <FormDatosPedido pedido={p} />
        </div>

        <aside className="editor__vista">
          {whatsapp && (
            <a className="boton boton--ancho" href={whatsapp} target="_blank" rel="noopener">
              Escribirle por WhatsApp
            </a>
          )}
          {p.origen === "web" && (
            <p className="campo__ayuda">
              El cliente mandó este código en su mensaje de WhatsApp: buscalo en el chat para encontrar la conversación.
            </p>
          )}
          <form action={borrarPedido}>
            <input type="hidden" name="id" value={p.id} />
            <BotonConfirmar pregunta={`¿Borrar el pedido ${p.codigo}? Si había descontado stock, se devuelve.`}>
              Borrar pedido
            </BotonConfirmar>
          </form>
        </aside>
      </div>
    </>
  );
}

export default function PaginaPedido(props: PageProps<"/admin/pedidos/[id]">) {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Buscando el pedido…</p>}>
      <Detalle params={props.params} />
    </Suspense>
  );
}
