import type { Metadata } from "next";
import { Suspense } from "react";
import { FormVenta } from "@/components/admin/FormVenta";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { hoyEnArgentina } from "@/lib/pedidos";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Registrar una venta" };

async function Contenido() {
  const { supabase } = await exigirAdmin();
  // Todos los productos, también los ocultos: en una feria se puede vender algo que no está en la web.
  const { data } = await supabase.from("productos").select("id, nombre, precio, stock").order("nombre");
  const productos = (data ?? []).map((p) => ({ ...p, stock: p.stock ?? undefined }));

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">en la feria, por Instagram o en persona</span>
          <h1>Registrar una venta</h1>
        </div>
      </div>
      <FormVenta productos={productos} hoy={hoyEnArgentina()} />
    </>
  );
}

export default function NuevaVenta() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Abriendo el cuaderno de ventas…</p>}>
      <Contenido />
    </Suspense>
  );
}
