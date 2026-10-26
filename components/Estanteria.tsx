import { obtenerCatalogo, obtenerCategorias } from "@/lib/catalogo";
import { unoPorFormato, type TipoProducto } from "@/lib/productos";
import { Catalogo } from "./Catalogo";
import { TallerAviso } from "./EnElTaller";
import { Ficha } from "./Ficha";

/* Puentes de servidor entre el catálogo (Supabase o respaldo) y las grillas de fichas. */

export async function Estanteria({ tipo }: { tipo: TipoProducto }) {
  const [catalogo, categorias] = await Promise.all([obtenerCatalogo(), obtenerCategorias()]);
  const productos = unoPorFormato(catalogo.filter((p) => p.tipo === tipo));
  if (productos.length === 0) return <TallerAviso />;
  // Solo las categorías que tienen algo: un filtro que da cero no ayuda.
  const conProductos = (categorias[tipo] ?? []).filter(([id]) => productos.some((p) => p.cat === id));
  return <Catalogo productos={productos} categorias={conProductos} />;
}

export async function Destacados({ tipo }: { tipo: TipoProducto }) {
  const productos = (await obtenerCatalogo()).filter((p) => p.tipo === tipo && p.destacado).slice(0, 4);
  return (
    <div className="grilla-fichas grilla-fichas--cuatro">
      {productos.map((p, n) => (
        <Ficha key={p.id} producto={p} orden={n} />
      ))}
    </div>
  );
}
