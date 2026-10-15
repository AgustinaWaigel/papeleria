import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SelectorEstado } from "@/components/admin/SelectorEstado";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { precio } from "@/lib/contacto";
import { CONFIRMADOS, ESTADOS, fechaLinda, hoyEnArgentina, mesLindo, moverMes, type Pedido } from "@/lib/pedidos";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Pedidos y ventas" };

const resumirItems = (p: Pedido) =>
  p.pedido_items.map((i) => (i.cantidad > 1 ? `${i.cantidad} × ${i.nombre}` : i.nombre)).join(", ");

async function Pedidos({ searchParams }: Pick<PageProps<"/admin/pedidos">, "searchParams">) {
  const { supabase } = await exigirAdmin();
  const params = await searchParams;
  const mesActual = hoyEnArgentina().slice(0, 7);
  const mes = typeof params.mes === "string" && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : mesActual;
  const filtro = typeof params.estado === "string" ? params.estado : "todos";

  const [{ data, error }, { count: sinConfirmar }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*, pedido_items(*)")
      .gte("fecha", `${mes}-01`)
      .lt("fecha", `${moverMes(mes, 1)}-01`)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false }),
    supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("estado", "nuevo"),
  ]);
  const pedidos = (data ?? []) as Pedido[];

  // Resumen del mes: solo cuenta lo confirmado.
  const confirmados = pedidos.filter((p) => CONFIRMADOS.includes(p.estado));
  const facturado = confirmados.reduce((s, p) => s + p.total, 0);
  const porProducto = new Map<string, number>();
  for (const p of confirmados) for (const i of p.pedido_items) porProducto.set(i.nombre, (porProducto.get(i.nombre) ?? 0) + i.cantidad);
  const masVendidos = [...porProducto].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const porEnviar = pedidos.filter((p) => p.estado === "pagado").length;

  const visibles = filtro === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtro);
  const enlace = (cambios: Record<string, string>) => {
    const q = new URLSearchParams({ mes, estado: filtro, ...cambios });
    if (q.get("mes") === mesActual) q.delete("mes");
    if (q.get("estado") === "todos") q.delete("estado");
    return `/admin/pedidos${q.size ? `?${q}` : ""}`;
  };

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">la caja del taller</span>
          <h1>Pedidos y ventas</h1>
        </div>
        <Link className="boton" href="/admin/pedidos/nueva">
          Registrar una venta
        </Link>
      </div>

      {typeof params.listo === "string" && (
        <p className="admin__exito" role="status">
          Listo: la venta {params.listo} quedó registrada.
        </p>
      )}
      {error && <p className="admin__error">No se pudieron leer los pedidos: {error.message}. ¿Corriste supabase/02-pedidos-y-mas.sql?</p>}

      <div className="admin__mes">
        <Link className="boton boton--claro boton--chico" href={enlace({ mes: moverMes(mes, -1) })} aria-label="Mes anterior">
          ←
        </Link>
        <h2>{mesLindo(mes)}</h2>
        {mes < mesActual && (
          <Link className="boton boton--claro boton--chico" href={enlace({ mes: moverMes(mes, 1) })} aria-label="Mes siguiente">
            →
          </Link>
        )}
      </div>

      <div className="tableros">
        <div className="tablero tablero--halo">
          <span>Vendido</span>
          <strong>{precio(facturado)}</strong>
          <small>
            {confirmados.length} {confirmados.length === 1 ? "venta confirmada" : "ventas confirmadas"}
          </small>
        </div>
        <div className="tablero">
          <span>Ticket promedio</span>
          <strong>{precio(confirmados.length ? Math.round(facturado / confirmados.length) : 0)}</strong>
          <small>por venta</small>
        </div>
        <Link className="tablero tablero--lavanda" href={enlace({ estado: "nuevo", mes: mesActual })}>
          <span>Sin confirmar</span>
          <strong>{sinConfirmar ?? 0}</strong>
          <small>pedidos de la web, en total</small>
        </Link>
        <Link className="tablero" href={enlace({ estado: "pagado" })}>
          <span>Para enviar</span>
          <strong>{porEnviar}</strong>
          <small>pagados este mes</small>
        </Link>
        {masVendidos.length > 0 && (
          <div className="tablero tablero--lista">
            <span>Lo más vendido</span>
            <ol>
              {masVendidos.map(([nombre, cantidad]) => (
                <li key={nombre}>
                  {nombre} <small>× {cantidad}</small>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="filtros" role="group" aria-label="Filtrar por estado">
        {[["todos", "Todos"], ...ESTADOS].map(([id, nombre]) => (
          <Link key={id} className="filtro" href={enlace({ estado: id })} aria-current={filtro === id ? "true" : undefined}>
            {nombre}
          </Link>
        ))}
      </div>

      <div className="admin__tabla-marco">
        <table className="admin__tabla">
          <thead>
            <tr>
              <th scope="col">Pedido</th>
              <th scope="col">Cliente</th>
              <th scope="col">Qué lleva</th>
              <th scope="col">Total</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((p, n) => (
              <tr key={p.id} className={p.estado === "cancelado" ? "admin__oculto" : undefined} style={{ "--n": n % 12 } as React.CSSProperties}>
                <td>
                  <Link className="admin__codigo" href={`/admin/pedidos/${p.id}`}>
                    {p.codigo}
                  </Link>
                  <small className="admin__dato">
                    {fechaLinda(p.fecha)} · {p.origen === "web" ? "web" : "venta directa"}
                  </small>
                </td>
                <td>
                  {p.cliente_nombre ?? <span className="admin__dato">—</span>}
                  {p.medio_pago && <small className="admin__dato">{p.medio_pago}</small>}
                </td>
                <td className="admin__items">{resumirItems(p) || "—"}</td>
                <td className="admin__precio">{precio(p.total)}</td>
                <td>
                  <SelectorEstado id={p.id} estado={p.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && (
          <p className="admin__vacio">
            {filtro === "todos" ? "Todavía no hay pedidos este mes." : "No hay pedidos en este estado este mes."}
          </p>
        )}
      </div>
    </>
  );
}

export default function PaginaPedidos(props: PageProps<"/admin/pedidos">) {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Contando la caja…</p>}>
      <Pedidos searchParams={props.searchParams} />
    </Suspense>
  );
}
