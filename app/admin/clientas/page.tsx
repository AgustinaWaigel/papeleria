import type { Metadata } from "next";
import { Suspense } from "react";
import { borrarFotoClienta } from "../tienda-acciones";
import { BotonConfirmar } from "@/components/admin/BotonConfirmar";
import { FormFotoClienta } from "@/components/admin/FormFotoClienta";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import type { FotoClienta } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Así lo usan" };

async function Contenido() {
  const { supabase } = await exigirAdmin();
  const [{ data, error }, { data: productos }] = await Promise.all([
    supabase.from("fotos_clientas").select("id, foto, autora, producto_id").order("orden").order("creado_en", { ascending: false }),
    supabase.from("productos").select("id, nombre").order("nombre"),
  ]);
  const fotos = (data ?? []) as FotoClienta[];
  const nombres = new Map((productos ?? []).map((p) => [p.id as string, p.nombre as string]));

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">fotos de clientas</span>
          <h1>Así lo usan</h1>
        </div>
      </div>
      {error && <p className="admin__error">No se pudieron leer: {error.message}. ¿Corriste supabase/11-muestras-regalo-fotos-presupuestos.sql?</p>}
      <p className="campo__ayuda mb-e5">
        Las fotos que te mandan o que suben a Instagram usando tus productos. Aparecen en la página del producto y en Inicio.
        Pedí permiso antes de subirlas y poné su usuario, así se sienten parte.
      </p>

      <FormFotoClienta productos={[...nombres]} />

      {fotos.length > 0 && (
        <ul className="clientas-admin">
          {fotos.map((f) => (
            <li key={f.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel */}
              <img src={f.foto} alt="" />
              <span className="admin__dato">
                {f.autora ?? "Sin autora"}
                {f.producto_id && ` · ${nombres.get(f.producto_id) ?? f.producto_id}`}
              </span>
              <form action={borrarFotoClienta}>
                <input type="hidden" name="id" value={f.id} />
                <BotonConfirmar pregunta="¿Borrar esta foto?">Borrar</BotonConfirmar>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Clientas() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Mirando las fotos…</p>}>
      <Contenido />
    </Suspense>
  );
}
