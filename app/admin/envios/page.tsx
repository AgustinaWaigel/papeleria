import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorZonas } from "@/components/admin/EditorZonas";
import { FormCorreo } from "@/components/admin/FormCorreo";
import { FormEnvio } from "@/components/admin/FormEnvio";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { ambienteCorreo, correoConfigurado } from "@/lib/correo";
import { supabaseConfigurado } from "@/lib/supabase/config";
import type { Zona } from "@/lib/zonas";

export const metadata: Metadata = { title: "Envíos" };

async function Contenido() {
  const { supabase } = await exigirAdmin();
  const [{ data, error }, { data: zonas }] = await Promise.all([
    supabase.from("ajustes").select("envio_costo, envio_gratis_desde, envio_detalle").maybeSingle(),
    supabase.from("zonas_envio").select("id, nombre, provincias, codigos_postales, costo, orden").order("orden"),
  ]);
  // La caja para cotizar con Correo Argentino (columnas de supabase/07-envios-cupones-y-mas.sql).
  const { data: caja } = await supabase.from("ajustes").select("caja_alto, caja_ancho, caja_largo, peso_por_defecto, envio_recargo").maybeSingle();

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">cuánto cuesta volar</span>
          <h1>Envíos</h1>
        </div>
      </div>
      {error && <p className="admin__error">No se pudieron leer: {error.message}. ¿Corriste supabase/07-envios-cupones-y-mas.sql?</p>}
      <p className="campo__ayuda mb-e5">
        Lo usa el pago online: quien elige envío a domicilio pone su código postal, ve el costo de su zona y lo paga junto
        con el pedido. Retirar no tiene costo. Los pedidos por WhatsApp se siguen coordinando a mano. Revisá los precios
        cuando el correo actualice sus tarifas.
      </p>
      <div className="editor__campos">
        <EditorZonas zonas={(zonas ?? []) as Zona[]} />
        {caja && <FormCorreo conectado={correoConfigurado} ambiente={ambienteCorreo} caja={caja} />}
        <FormEnvio envio={{ costo: data?.envio_costo ?? null, gratisDesde: data?.envio_gratis_desde ?? null, detalle: data?.envio_detalle ?? null, zonas: [] }} />
      </div>
    </>
  );
}

export default function Envios() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Midiendo distancias…</p>}>
      <Contenido />
    </Suspense>
  );
}
