import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { moderarResena } from "../tienda-acciones";
import { BotonConfirmar } from "@/components/admin/BotonConfirmar";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Reseñas" };

type FilaResena = {
  id: number;
  producto_id: string;
  nombre: string;
  texto: string;
  puntaje: number;
  aprobada: boolean;
  creado_en: string;
  productos: { nombre: string } | null;
};

function Acciones({ r }: { r: FilaResena }) {
  return (
    <div className="admin__acciones">
      <form action={moderarResena}>
        <input type="hidden" name="id" value={r.id} />
        <input type="hidden" name="accion" value={r.aprobada ? "ocultar" : "aprobar"} />
        <button className={`boton boton--chico${r.aprobada ? " boton--claro" : ""}`} type="submit">
          {r.aprobada ? "Ocultar" : "Publicar"}
        </button>
      </form>
      <form action={moderarResena}>
        <input type="hidden" name="id" value={r.id} />
        <input type="hidden" name="accion" value="borrar" />
        <BotonConfirmar pregunta={`¿Borrar la reseña de ${r.nombre}?`}>Borrar</BotonConfirmar>
      </form>
    </div>
  );
}

async function Contenido() {
  const { supabase } = await exigirAdmin();
  const { data, error } = await supabase
    .from("resenas")
    .select("*, productos(nombre)")
    .order("aprobada")
    .order("creado_en", { ascending: false });
  const resenas = (data ?? []) as FilaResena[];
  const pendientes = resenas.filter((r) => !r.aprobada);

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">lo que dicen de ustedes</span>
          <h1>Reseñas</h1>
        </div>
      </div>
      {error && <p className="admin__error">No se pudieron leer: {error.message}. ¿Corriste supabase/02-pedidos-y-mas.sql?</p>}
      <p className="campo__ayuda mb-e5">
        {pendientes.length > 0
          ? `Hay ${pendientes.length} ${pendientes.length === 1 ? "reseña esperando" : "reseñas esperando"} que la leas. Ninguna se publica sola.`
          : "Nada pendiente. Las reseñas nuevas aparecen acá primero y se publican cuando vos lo decidís."}
      </p>
      <ul className="resenas-admin">
        {resenas.map((r, n) => (
          <li key={r.id} className={`resena resena--admin${r.aprobada ? "" : " resena--pendiente"}`} style={{ "--n": n % 12 } as React.CSSProperties}>
            <div className="resena__cabeza">
              <span className="resena__estrellas" aria-label={`${r.puntaje} de 5 estrellas`}>
                {"★".repeat(r.puntaje) + "☆".repeat(5 - r.puntaje)}
              </span>
              <span className="admin__dato">
                {r.aprobada ? "Publicada" : "Pendiente"} · <Link href={`/producto/${r.producto_id}`}>{r.productos?.nombre ?? r.producto_id}</Link> ·{" "}
                {new Date(r.creado_en).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
              </span>
            </div>
            <p>{r.texto}</p>
            <footer>— {r.nombre}</footer>
            <Acciones r={r} />
          </li>
        ))}
      </ul>
      {resenas.length === 0 && !error && <p className="admin__vacio">Todavía nadie dejó una reseña.</p>}
    </>
  );
}

export default function Resenas() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Leyendo las reseñas…</p>}>
      <Contenido />
    </Suspense>
  );
}
