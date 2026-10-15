import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorCategorias, type FilaCategoria } from "@/components/admin/EditorCategorias";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Categorías" };

async function Contenido() {
  const { supabase } = await exigirAdmin();
  const [{ data: categorias, error }, { data: productos }] = await Promise.all([
    supabase.from("categorias").select("id, tipo, nombre, orden").order("orden").order("nombre"),
    supabase.from("productos").select("cat"),
  ]);
  const cuenta = new Map<string, number>();
  for (const p of productos ?? []) if (p.cat) cuenta.set(p.cat, (cuenta.get(p.cat) ?? 0) + 1);
  const de = (tipo: string): FilaCategoria[] =>
    (categorias ?? []).filter((c) => c.tipo === tipo).map((c) => ({ ...c, productos: cuenta.get(c.id) ?? 0 }));

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">los filtros de cada estante</span>
          <h1>Categorías</h1>
        </div>
      </div>
      {error && <p className="admin__error">No se pudieron leer: {error.message}. ¿Corriste supabase/02-pedidos-y-mas.sql?</p>}
      <p className="campo__ayuda mb-e5">
        Son los filtros que aparecen arriba de Papelería y Descargables. Los packs no usan categorías. Una categoría sin
        productos no se muestra en la tienda.
      </p>
      <div className="editor__campos">
        <EditorCategorias tipo="fisico" titulo="Papelería" categorias={de("fisico")} />
        <EditorCategorias tipo="descargable" titulo="Descargables" categorias={de("descargable")} />
      </div>
    </>
  );
}

export default function Categorias() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Ordenando los estantes…</p>}>
      <Contenido />
    </Suspense>
  );
}
