import Link from "next/link";
import { Suspense } from "react";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { TablaProductos } from "@/components/admin/TablaProductos";
import { exigirAdmin } from "@/lib/admin";
import { desdeFila, type FilaProducto } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/supabase/config";

async function Lista({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const { supabase, email } = await exigirAdmin();
  const { listo } = await searchParams;
  const { data, error } = await supabase.from("productos").select("*").order("orden").order("nombre");
  const filas = (data ?? []) as FilaProducto[];
  const productos = filas.map((f) => ({ ...desdeFila(f), activo: f.activo }));

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">hola, {email}</span>
          <h1>Productos</h1>
        </div>
        <div className="fila-botones">
          <Link className="boton" href="/admin/productos/nuevo">
            Nuevo producto
          </Link>
        </div>
      </div>

      {typeof listo === "string" && (
        <p className="admin__exito" role="status">
          Listo: «{listo}» quedó guardado y ya se ve en la tienda.
        </p>
      )}
      {error && <p className="admin__error">No se pudo leer la tabla: {error.message}</p>}

      <TablaProductos productos={productos} />
    </>
  );
}

export default function PaginaAdmin(props: PageProps<"/admin">) {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Abriendo el cajón de productos…</p>}>
      <Lista searchParams={props.searchParams} />
    </Suspense>
  );
}
