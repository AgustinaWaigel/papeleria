import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormProducto } from "@/components/admin/FormProducto";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { desdeFila, obtenerCategorias, type FilaProducto } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Editar producto" };

async function Contenido({ params }: Pick<PageProps<"/admin/productos/[id]">, "params">) {
  const { supabase } = await exigirAdmin();
  const { id } = await params;
  const { data } = await supabase.from("productos").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const fila = data as FilaProducto;

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">editando</span>
          <h1>{fila.nombre}</h1>
        </div>
        {fila.activo && (
          <a className="boton boton--claro boton--chico" href={`/producto/${fila.id}`} target="_blank">
            Ver en la tienda
          </a>
        )}
      </div>
      <FormProducto producto={{ ...desdeFila(fila), activo: fila.activo, orden: fila.orden }} categorias={await obtenerCategorias()} />
    </>
  );
}

export default function EditarProducto(props: PageProps<"/admin/productos/[id]">) {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Buscando el producto…</p>}>
      <Contenido params={props.params} />
    </Suspense>
  );
}
