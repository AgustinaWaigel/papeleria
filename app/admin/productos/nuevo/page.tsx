import type { Metadata } from "next";
import { Suspense } from "react";
import { FormProducto } from "@/components/admin/FormProducto";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { obtenerCategorias } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Nuevo producto" };

async function Contenido() {
  await exigirAdmin();
  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">recién salido del taller</span>
          <h1>Nuevo producto</h1>
        </div>
      </div>
      <FormProducto categorias={await obtenerCategorias()} />
    </>
  );
}

export default function NuevoProducto() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Preparando la hoja en blanco…</p>}>
      <Contenido />
    </Suspense>
  );
}
