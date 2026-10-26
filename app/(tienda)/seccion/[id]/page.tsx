import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Portadilla, Seccion } from "@/components/Bloques";
import { Ficha } from "@/components/Ficha";
import { obtenerCatalogo, obtenerSecciones } from "@/lib/catalogo";
import { idEtiqueta, tieneEtiqueta } from "@/lib/productos";

/* Una sección del menú "Productos" (tabla secciones) o una etiqueta suelta: en los dos casos, todos los
   productos que la llevan, sean de papelería o descargables. */
async function buscarSeccion(id: string) {
  const [catalogo, secciones] = await Promise.all([obtenerCatalogo(), obtenerSecciones()]);
  const productos = catalogo.filter((p) => tieneEtiqueta(p, id));
  const seccion = secciones.find((s) => s.id === id);
  // Una etiqueta sin sección se llama como la escribieron en el producto.
  const nombre = seccion?.nombre ?? productos.flatMap((p) => p.etiquetas ?? []).find((e) => idEtiqueta(e) === id);
  if (!nombre) return null;
  return { nombre, descripcion: seccion?.descripcion, esSeccion: Boolean(seccion), productos, secciones };
}

export async function generateStaticParams() {
  const [catalogo, secciones] = await Promise.all([obtenerCatalogo(), obtenerSecciones()]);
  const ids = new Set([...secciones.map((s) => s.id), ...catalogo.flatMap((p) => (p.etiquetas ?? []).map(idEtiqueta))]);
  // Con Cache Components tiene que haber al menos uno: sin secciones va uno que da 404.
  return ids.size > 0 ? [...ids].filter(Boolean).map((id) => ({ id })) : [{ id: "sin-secciones" }];
}

export async function generateMetadata({ params }: PageProps<"/seccion/[id]">): Promise<Metadata> {
  const { id } = await params;
  const s = await buscarSeccion(id);
  if (!s) return {};
  return {
    title: s.nombre,
    description: s.descripcion ?? `${s.nombre}: productos de Alas de Ángel Papelería.`,
    alternates: { canonical: `/seccion/${id}` },
  };
}

export default async function PaginaSeccion({ params }: PageProps<"/seccion/[id]">) {
  const { id } = await params;
  const s = await buscarSeccion(id);
  if (!s) notFound();

  // Para saltar de una sección a otra sin volver al menú.
  const otras = s.secciones.filter((o) => o.id !== id);

  return (
    <>
      <Portadilla chica nota={s.esSeccion ? "por sección" : "etiqueta"} titulo={s.nombre}>
        {s.descripcion ?? `Todo lo que tenemos con la etiqueta «${s.nombre}».`}
      </Portadilla>

      <Seccion>
        {otras.length > 0 && (
          <nav className="filtros" aria-label="Otras secciones">
            {otras.map((o) => (
              <Link key={o.id} className="filtro" href={`/seccion/${o.id}`}>
                {o.nombre}
              </Link>
            ))}
          </nav>
        )}
        <p className="catalogo__cuenta">
          {s.productos.length === 0
            ? "Por ahora no hay productos acá. Volvé pronto."
            : `${s.productos.length} ${s.productos.length === 1 ? "producto" : "productos"}`}
        </p>
        <div className="grilla-fichas grilla-fichas--barajar">
          {s.productos.map((p, n) => (
            <Ficha key={p.id} producto={p} orden={n} />
          ))}
        </div>
      </Seccion>
    </>
  );
}
