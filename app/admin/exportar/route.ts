import { exigirAdmin } from "@/lib/admin";
import { obtenerCategorias, type FilaProducto } from "@/lib/catalogo";
import { armarExcel } from "@/lib/excel";

/* Descarga todos los productos (también los ocultos) en un Excel. Sin productos sirve de plantilla. */
export async function GET() {
  const { supabase } = await exigirAdmin();
  const [{ data, error }, categorias] = await Promise.all([
    supabase.from("productos").select("*").order("tipo").order("orden").order("nombre"),
    obtenerCategorias(),
  ]);
  if (error) return new Response(`No se pudo leer la tabla: ${error.message}`, { status: 500 });

  const archivo = await armarExcel((data ?? []) as FilaProducto[], categorias);
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(archivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="productos-alas-de-angel-${fecha}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
