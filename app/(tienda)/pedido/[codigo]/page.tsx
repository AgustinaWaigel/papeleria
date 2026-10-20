import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { reintentarPago } from "../../acciones";
import { Portadilla, Seccion } from "@/components/Bloques";
import { VaciarBolsita } from "@/components/VaciarBolsita";
import { enlaceWhatsApp, precio } from "@/lib/contacto";
import { pagoOnlineConfigurado, sincronizarPago } from "@/lib/mercadopago";
import { obtenerCatalogo } from "@/lib/catalogo";
import { CONFIRMADOS, fechaLinda } from "@/lib/pedidos";
import { nombreEntrega, pasos, textoPago, type PedidoCliente } from "@/lib/seguimiento";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico } from "@/lib/supabase/servidor";

/* El seguimiento de un pedido: lo ve quien tenga el link con la clave (le llega al comprar). */
export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };

/* Con Cache Components la ruta necesita al menos un código para armar su esqueleto (como la de producto).
   Este no existe nunca: los pedidos reales se arman en el momento de la visita. */
export async function generateStaticParams() {
  return [{ codigo: "AA-00000" }];
}

const leer = async (codigo: string, clave: string) =>
  (await clientePublico().rpc("ver_pedido", { p_codigo: codigo, p_clave: clave })).data as PedidoCliente | null;

async function Seguimiento({ params, searchParams }: PageProps<"/pedido/[codigo]">) {
  const { codigo } = await params;
  const consulta = await searchParams;
  const clave = typeof consulta.clave === "string" ? consulta.clave : "";

  let p = supabaseConfigurado && clave ? await leer(codigo, clave) : null;
  if (!p) return <NoEncontrado />;

  // Si el aviso de Mercado Pago todavía no llegó, se le pregunta directo.
  if (pagoOnlineConfigurado && p.medio_pago === "Mercado Pago" && p.estado === "nuevo" && p.pago_estado !== "approved") {
    try {
      await sincronizarPago(codigo);
      p = (await leer(codigo, clave)) ?? p;
    } catch (e) {
      console.error("No se pudo consultar el pago en Mercado Pago:", e);
    }
  }

  const pagado = CONFIRMADOS.includes(p.estado);
  // Los PDF de los descargables le llegan por mail cuando el pedido queda pagado (ver lib/mails.ts).
  const descargables = new Set((await obtenerCatalogo()).filter((x) => x.tipo === "descargable").map((x) => x.id));
  const conPdf = p.items.some((i) => i.id && descargables.has(i.id));
  const lista = pasos(p.entrega);
  // Si ya está más adelante que el último paso (un descargable marcado entregado), queda en el último.
  const encontrado = lista.findIndex(([estado]) => estado === p.estado);
  const actual = encontrado === -1 && pagado ? lista.length - 1 : encontrado;
  const pago = p.medio_pago === "Mercado Pago" ? textoPago(p.pago_estado) : null;
  const whatsapp = enlaceWhatsApp(`¡Hola Alas de Ángel! Te escribo por mi pedido ${p.codigo}.`);

  return (
    <>
      {/* Mercado Pago solo vuelve con vaciar=1 cuando el pago salió o quedó pendiente: la compra ya está hecha. */}
      {consulta.vaciar === "1" && <VaciarBolsita />}
      <Portadilla nota={`pedido del ${fechaLinda(p.fecha)}`} titulo={p.codigo}>
        {p.cliente_nombre ? `¡Gracias, ${p.cliente_nombre}! ` : "¡Gracias! "}
        Guardá esta página: acá vas a ver cómo va tu pedido.
      </Portadilla>

      <Seccion>
        <div className="seguimiento">
          <div>
            {p.estado === "cancelado" ? (
              <p className="seguimiento__aviso seguimiento__aviso--mal" role="status">
                Este pedido se canceló. Si es un error, escribinos.
              </p>
            ) : (
              <ol className="seguimiento__pasos">
                {lista.map(([estado, nombre], n) => (
                  <li key={estado} className={n < actual ? "hecho" : n === actual ? "actual" : undefined} aria-current={n === actual ? "step" : undefined}>
                    {nombre}
                  </li>
                ))}
              </ol>
            )}

            {/* Mientras espera el pago; y recién pagado, para que quien vuelve de Mercado Pago vea la confirmación. */}
            {pago && (p.estado === "nuevo" || (p.estado === "pagado" && p.pago_estado === "approved")) && (
              <div className={`seguimiento__aviso seguimiento__aviso--${pago.tono}`} role="status">
                <p>{pago.texto}</p>
                {pago.tono === "mal" && p.pago_estado !== "refunded" && p.pago_estado !== "charged_back" && pagoOnlineConfigurado && (
                  <form action={reintentarPago}>
                    <input type="hidden" name="codigo" value={p.codigo} />
                    <input type="hidden" name="clave" value={clave} />
                    <button className="boton boton--chico" type="submit">
                      Pagar de nuevo
                    </button>
                  </form>
                )}
              </div>
            )}

            {conPdf && pagado && (
              <div className="seguimiento__aviso seguimiento__aviso--bien" role="status">
                <p>
                  <strong>Te mandamos los PDF a tu mail.</strong> Si en unos minutos no lo ves, fijate en spam o promociones, o
                  escribinos por WhatsApp.
                </p>
              </div>
            )}

            <h2 className="seguimiento__subtitulo">Qué lleva</h2>
            <ul className="seguimiento__items">
              {p.items.map((i, n) => (
                <li key={n}>
                  <span>
                    {i.cantidad} × {i.id ? <Link href={`/producto/${i.id}`}>{i.nombre}</Link> : i.nombre}
                  </span>
                  <span className="seguimiento__precio">{precio(i.precio * i.cantidad)}</span>
                </li>
              ))}
              {(p.descuento ?? 0) > 0 && (
                <li>
                  <span>Descuento{p.cupon && ` (cupón ${p.cupon})`}</span>
                  <span className="seguimiento__precio">−{precio(p.descuento!)}</span>
                </li>
              )}
              {(p.costo_envio ?? 0) > 0 && (
                <li>
                  <span>Envío</span>
                  <span className="seguimiento__precio">{precio(p.costo_envio!)}</span>
                </li>
              )}
              <li className="seguimiento__total">
                <span>Total</span>
                <span className="seguimiento__precio">{precio(p.total)}</span>
              </li>
            </ul>
          </div>

          <aside className="seguimiento__datos">
            <dl>
              <dt>Cómo lo recibís</dt>
              <dd>{nombreEntrega(p.entrega)}</dd>
              {p.direccion && (
                <>
                  <dt>Dirección</dt>
                  <dd>{p.direccion}</dd>
                </>
              )}
              {p.seguimiento && (
                <>
                  <dt>Número de seguimiento del envío</dt>
                  <dd className="seguimiento__numero">{p.seguimiento}</dd>
                </>
              )}
              {p.medio_pago && (
                <>
                  <dt>Pago</dt>
                  <dd>{p.medio_pago}</dd>
                </>
              )}
            </dl>
            <a className="boton boton--claro boton--ancho" href={whatsapp} target="_blank" rel="noopener">
              Consultar por WhatsApp
            </a>
          </aside>
        </div>
      </Seccion>
    </>
  );
}

function NoEncontrado() {
  return (
    <Portadilla nota="mmm…" titulo="No encontramos ese pedido">
      Revisá que el link esté completo (es el que te mostramos al pagar). Si no lo encontrás, escribinos por WhatsApp con tu
      código de pedido.
    </Portadilla>
  );
}

export default function PaginaSeguimiento(props: PageProps<"/pedido/[codigo]">) {
  return (
    <Suspense fallback={<Portadilla nota="un segundo" titulo="Buscando tu pedido…">Ya casi.</Portadilla>}>
      <Seguimiento {...props} />
    </Suspense>
  );
}
