import type { MetadataRoute } from "next";
import { obtenerCatalogo, obtenerSecciones } from "@/lib/catalogo";
import { PAGINAS, PAGINAS_LEGALES, PAGINAS_PIE } from "@/lib/paginas";
import { rutaProducto, tieneEtiqueta } from "@/lib/productos";
import { SITIO_URL } from "@/lib/sitio";

/* El mapa del sitio para Google: las páginas fijas, las secciones con productos y un renglón por producto. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productos, secciones] = await Promise.all([obtenerCatalogo(), obtenerSecciones()]);
  const paginas = ["/", ...new Set([...PAGINAS, ...PAGINAS_PIE, ...PAGINAS_LEGALES].map(([href]) => href))].filter((href) => href !== "/buscar");

  return [
    ...paginas.map((href) => ({ url: SITIO_URL + href, priority: href === "/" ? 1 : 0.7 })),
    ...secciones
      .filter((s) => productos.some((p) => tieneEtiqueta(p, s.id)))
      .map((s) => ({ url: `${SITIO_URL}/seccion/${s.id}`, priority: 0.7 })),
    ...productos.map((p) => ({
      url: SITIO_URL + rutaProducto(p.id),
      priority: 0.8,
      ...(p.fotos && { images: p.fotos.map((f) => (f.startsWith("http") ? f : SITIO_URL + f)) }),
    })),
  ];
}
