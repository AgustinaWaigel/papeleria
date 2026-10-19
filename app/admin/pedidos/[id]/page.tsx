import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { borrarPedido } from "../acciones";
import { BotonConfirmar } from "@/components/admin/BotonConfirmar";
import type { TipoMail } from "../acciones";
import { BotonMail } from "@/components/admin/BotonMail";
import { CopiarTexto } from "@/components/admin/CopiarTexto";
import { FormDatosPedido } from "@/components/admin/FormDatosPedido";
import { SelectorEstado } from "@/components/admin/SelectorEstado";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { precio } from "@/lib/contacto";
import { CONFIRMADOS, ESTADOS_MP, fechaLinda, whatsappDe, type Pedido } from "@/lib/pedidos";
import { linkDeSeguimiento } from "@/lib/seguimiento";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Pedido" };

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });

async function Detalle({ params }: Pick<PageProps<"/admin/pedidos/[id]">, "params">) {
  const { supabase } = await exigirAdmin();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const { data } = await supabase.from("pedidos").select("*, pedido_items(*)").eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const p = data as Pedido;
  const whatsapp = whatsappDe(p.cliente_contacto);
  const pago = p.pago_estado ? (ESTADOS_MP[p.pago_estado] ?? p.pago_estado) : null;
  // ¿Lleva algún descargable? Esos le llegan al cliente por mail.
  const ids = p.pedido_items.flatMap((i) => (i.producto_id ? [i.producto_id] : []));
  const { count } = ids.length
    ? await supabase.from("productos").select("id", { count: "exact", head: true }).in("id", ids).eq("tipo", "descargable")
    : { count: 0 };
  const conPdf = (count ?? 0) > 0;
  const soloPdf = conPdf && count === ids.length && p.pedido_items.every((i) => i.producto_id);
  const pagado = CONFIRMADOS.includes(p.estado);
  const retiro = p.entrega === "retiro";

  // Los mails que corresponden a este pedido, con cuándo salieron (o cuándo salen solos).
  const mails: { tipo: TipoMail; nombre: string; enviadoEn: string | null | undefined; cuando: string; posible: boolean }[] = [
    ...(!soloPdf
      ? [{ tipo: "confirmacion" as const, nombre: "Recibimos tu compra", enviadoEn: p.mail_confirmacion_en, cuando: "Sale solo cuando el pedido queda pagado.", posible: pagado }]
      : []),
    ...(conPdf ? [{ tipo: "descargables" as const, nombre: "Los PDF", enviadoEn: p.pdf_enviado_en, cuando: "Salen solos cuando el pedido queda pagado.", posible: pagado }] : []),
    ...(!soloPdf && p.entrega !== "digital"
      ? [
          {
            tipo: "envio" as const,
            nombre: retiro ? "Listo para retirar" : "Tu pedido está en camino",
            enviadoEn: p.mail_envio_en,
            cuando: `Sale solo cuando lo pasás a Enviado${retiro ? "" : " (cargá antes el número de seguimiento, así va en el mail)"}.`,
            posible: p.estado === "enviado" || p.estado === "entregado",
          },
        ]
      : []),
  ];

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
                {(p.descuento ?? 0) > 0 && (
                  <tr>
                    <th scope="row" colSpan={3}>
                      Descuento{p.cupon && ` (cupón ${p.cupon})`}
                    </th>
                    <td className="admin__precio">−{precio(p.descuento!)}</td>
                  </tr>
                )}
                {(p.costo_envio ?? 0) > 0 && (
                  <tr>
                    <th scope="row" colSpan={3}>
                      Envío
                    </th>
                    <td className="admin__precio">{precio(p.costo_envio!)}</td>
                  </tr>
                )}
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
          {p.cliente_email && (
            <a className="boton boton--claro boton--ancho" href={`mailto:${p.cliente_email}?subject=Tu pedido ${p.codigo}`}>
              Escribirle un mail
            </a>
          )}
          {p.clave && (
            <>
              <CopiarTexto texto={linkDeSeguimiento(p.codigo, p.clave)}>Copiar link de seguimiento</CopiarTexto>
              <p className="campo__ayuda">
                {p.medio_pago === "Mercado Pago"
                  ? "Es donde el cliente ve cómo va su pedido. Ya lo recibió al pagar; podés reenviárselo si lo pierde."
                  : "Mandáselo al cliente: ahí ve qué compró y cómo va su pedido cada vez que le cambiás el estado."}
              </p>
            </>
          )}
          {pago && (
            <p className="campo__ayuda">
              <strong>Mercado Pago:</strong> {pago}
              {p.mp_pago_id && ` · pago n.º ${p.mp_pago_id}`}
            </p>
          )}
          {p.mail_confirmacion_en !== undefined && (
            <section className="admin__mails">
              <h2 className="admin__subtitulo">Mails al cliente</h2>
              {!p.cliente_email && <p className="campo__ayuda">Cargá su mail en Cliente y pago para que le lleguen.</p>}
              <ul>
                {mails.map(({ tipo, nombre, enviadoEn, cuando, posible }) => (
                  <li key={tipo}>
                    <strong>{nombre}</strong>
                    <span className="campo__ayuda">{enviadoEn ? `Enviado el ${fechaHora(enviadoEn)}.` : cuando}</span>
                    {posible && p.cliente_email && <BotonMail id={p.id} tipo={tipo} texto={enviadoEn ? "Reenviar" : "Mandar ahora"} />}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {p.origen === "web" && p.medio_pago !== "Mercado Pago" && (
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
