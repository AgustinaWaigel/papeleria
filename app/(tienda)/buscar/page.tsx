import type { Metadata } from "next";
import { Suspense } from "react";
import { Portadilla, Seccion } from "@/components/Bloques";
import { Buscador } from "@/components/Buscador";
import { obtenerCatalogo, obtenerCategorias } from "@/lib/catalogo";
import { SECCIONES } from "@/lib/productos";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Buscá entre los cuadernos, agendas, stickers, descargables y packs de Alas de Ángel.",
  robots: { index: false },
};

export default async function Buscar() {
  const [productos, categorias] = await Promise.all([obtenerCatalogo(), obtenerCategorias()]);
  // Los nombres de secciones y categorías también cuentan: "estudio" encuentra las hojas de estudio.
  const etiquetas: Record<string, string> = {
    ...Object.fromEntries(Object.entries(SECCIONES).map(([tipo, s]) => [tipo, s.nombre])),
    ...Object.fromEntries(Object.values(categorias).flat()),
  };

  return (
    <>
      <Portadilla nota="¿qué andás buscando?" titulo="Buscar">
        Escribí una palabra y te mostramos todo lo que tenemos.
      </Portadilla>
      <Seccion>
        {/* El buscador lee ?q= de la dirección: eso solo se sabe con la visita. */}
        <Suspense>
          <Buscador productos={productos} etiquetas={etiquetas} />
        </Suspense>
      </Seccion>
    </>
  );
}
