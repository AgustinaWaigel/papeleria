import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorSecciones } from "@/components/admin/EditorSecciones";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { idEtiqueta } from "@/lib/productos";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Secciones" };

async function Contenido() {
  const { supabase } = await exigirAdmin();
  const [{ data: secciones, error }, { data: productos }] = await Promise.all([
    supabase.from("secciones").select("id, nombre, descripcion, orden").order("orden").order("nombre"),
    supabase.from("productos").select("etiquetas").eq("activo", true),
  ]);
  // Cuántos productos de la tienda lleva cada etiqueta, y las que se usan sin tener sección.
  const cuenta = new Map<string, number>();
  const sueltas = new Map<string, string>();
  for (const p of (productos ?? []) as { etiquetas: string[] | null }[]) {
    for (const e of new Set((p.etiquetas ?? []).map(idEtiqueta))) cuenta.set(e, (cuenta.get(e) ?? 0) + 1);
    for (const e of p.etiquetas ?? []) if (!sueltas.has(idEtiqueta(e))) sueltas.set(idEtiqueta(e), e);
  }
  for (const s of secciones ?? []) sueltas.delete(s.id);

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">el menú Productos de la tienda</span>
          <h1>Secciones</h1>
        </div>
      </div>
      {error && <p className="admin__error">No se pudieron leer: {error.message}. ¿Corriste supabase/09-secciones-y-etiquetas.sql?</p>}
      <p className="campo__ayuda mb-e5">
        Cada sección junta los productos que tienen su misma etiqueta (se la ponés al editar el producto), sean de papelería
        o descargables. Aparecen en el menú «Productos» y en Inicio, y tienen su página. Una sección sin productos no se muestra
        en la tienda.
      </p>
      <EditorSecciones secciones={(secciones ?? []).map((s) => ({ ...s, productos: cuenta.get(s.id) ?? 0 }))} />
      {sueltas.size > 0 && (
        <section className="admin__grupo">
          <h2 className="admin__subtitulo">Etiquetas sin sección</h2>
          <p className="campo__ayuda">
            Se ven en la página de cada producto y tienen su página, pero no van en el menú. Para sumar una al menú, creá una
            sección con el mismo nombre.
          </p>
          <ul className="producto__etiquetas">
            {[...sueltas].map(([id, nombre]) => (
              <li key={id}>
                <a className="filtro" href={`/seccion/${id}`} target="_blank">
                  {nombre} <span className="admin__cuenta">{cuenta.get(id)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function Secciones() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Acomodando las secciones…</p>}>
      <Contenido />
    </Suspense>
  );
}
