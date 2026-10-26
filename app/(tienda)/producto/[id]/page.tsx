import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Seccion } from "@/components/Bloques";
import { BotonSumar } from "@/components/BotonSumar";
import { ElegirCantidad } from "@/components/ElegirCantidad";
import { Ficha, sello } from "@/components/Ficha";
import { FormAvisoStock } from "@/components/FormAvisoStock";
import { FormResena } from "@/components/FormResena";
import { Galeria } from "@/components/Galeria";
import { Precio } from "@/components/Precio";
import { AsiLoUsan } from "@/components/AsiLoUsan";
import { PorDentro } from "@/components/PorDentro";
import { obtenerCatalogo, obtenerFotosClientas, obtenerProducto, obtenerResenas, type Resena } from "@/lib/catalogo";
import { precio as precioTexto } from "@/lib/contacto";
import {
  Dibujo,
  ENTREGA_CANVA,
  FORMATOS,
  SECCIONES,
  agotado,
  rutaProducto,
  rutaSeccion,
  unoPorFormato,
  type Producto,
} from "@/lib/productos";
import { SITIO_URL } from "@/lib/sitio";

export async function generateStaticParams() {
  const ids = (await obtenerCatalogo()).map((p) => ({ id: p.id }));
  // Con Cache Components tiene que haber al menos uno: con la tabla vacía va uno que da 404.
  return ids.length > 0 ? ids : [{ id: "sin-productos" }];
}

export async function generateMetadata({ params }: PageProps<"/producto/[id]">): Promise<Metadata> {
  const p = await obtenerProducto((await params).id);
  if (!p) return {};
  // Con foto, la foto acompaña el link cuando se comparte; sin foto, la imagen general del sitio.
  return {
    title: p.nombre,
    description: p.desc,
    alternates: { canonical: rutaProducto(p.id) },
    openGraph: { title: p.nombre, description: p.desc, type: "website", ...(p.fotos?.[0] && { images: [p.fotos[0]] }) },
  };
}

const estrellas = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

/* Datos para Google: nombre, precio, disponibilidad y puntaje, en el formato que entiende. */
function DatosParaGoogle({ p, resenas }: { p: Producto; resenas: Resena[] }) {
  const datos = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    description: p.desc,
    sku: p.id,
    brand: { "@type": "Brand", name: "Alas de Ángel Papelería" },
    ...(p.fotos && { image: p.fotos.map((f) => (f.startsWith("http") ? f : SITIO_URL + f)) }),
    offers: {
      "@type": "Offer",
      url: SITIO_URL + rutaProducto(p.id),
      priceCurrency: "ARS",
      price: p.precio,
      availability: agotado(p) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    ...(resenas.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (resenas.reduce((s, r) => s + r.puntaje, 0) / resenas.length).toFixed(1),
        reviewCount: resenas.length,
      },
    }),
  };
  // "<" escapado: el texto lo escriben personas y no tiene que poder cerrar la etiqueta.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }} />;
}

export default async function PaginaProducto({ params }: PageProps<"/producto/[id]">) {
  const p = await obtenerProducto((await params).id);
  if (!p) notFound();

  const [resenas, todasLasFotos] = await Promise.all([obtenerResenas(p.id), obtenerFotosClientas()]);
  const fotosClientas = todasLasFotos.filter((f) => f.producto_id === p.id);
  const promedio = resenas.length > 0 ? resenas.reduce((s, r) => s + r.puntaje, 0) / resenas.length : 0;
  const seccion = SECCIONES[p.tipo];
  const caracteristicas = p.caracteristicas ?? p.detalle?.split(" · ") ?? [];
  const marca = sello(p);
  const catalogo = await obtenerCatalogo();
  // El mismo descargable en el otro formato (PDF para imprimir o editable en Canva), si está en la tienda.
  const otra = p.otraVersion ? catalogo.find((o) => o.id === p.otraVersion) : undefined;
  const formatos = otra ? [p, otra].sort((a, b) => Number(a.formato === "canva") - Number(b.formato === "canva")) : [];
  // Primero los de la misma categoría, después el resto del mismo tipo.
  const parecidos = unoPorFormato(catalogo)
    .filter((o) => o.tipo === p.tipo && o.id !== p.id && o.id !== otra?.id)
    .sort((a, b) => Number(b.cat === p.cat) - Number(a.cat === p.cat))
    .slice(0, 4);

  return (
    <>
      <DatosParaGoogle p={p} resenas={resenas} />
      <section className="seccion">
        <div className="contenedor">
          <Link className="producto__volver" href={seccion.ruta}>
            ← Volver a {seccion.nombre}
          </Link>

          <div className="producto">
            <div style={{ "--fondo": `var(--color-${p.color}-suave)` } as CSSProperties}>
              <Galeria fotos={p.fotos ?? []} nombre={p.nombre}>
                <Dibujo nombre={p.dibujo} color={p.color} />
              </Galeria>
            </div>

            <div className="producto__info">
              <span className="nota-mano">{seccion.nombre}</span>
              <h1>{p.nombre}</h1>
              {resenas.length > 0 && (
                <a className="producto__puntaje" href="#resenas">
                  <span aria-hidden="true">{estrellas(Math.round(promedio))}</span>
                  <span className="sr-only">{promedio.toFixed(1)} de 5 estrellas</span> ({resenas.length}{" "}
                  {resenas.length === 1 ? "reseña" : "reseñas"})
                </a>
              )}
              <div className="producto__precio-fila">
                <Precio producto={p} className="producto__precio" />
                {marca && <span className={`sello sello--quieto ${marca.clase}`}>{marca.texto}</span>}
              </div>
              <p className="producto__bajada">{p.desc}</p>

              {formatos.length > 0 && (
                <nav className="formatos" aria-label="Formato">
                  <span className="por-cantidad__titulo">Formato</span>
                  <div className="filtros">
                    {formatos.map((f) => (
                      <Link
                        key={f.id}
                        className="filtro"
                        href={rutaProducto(f.id)}
                        aria-current={f.id === p.id ? "true" : undefined}
                        replace
                        scroll={false}
                      >
                        {FORMATOS.find(([id]) => id === (f.formato ?? "pdf"))?.[1]} · {precioTexto(f.precio)}
                      </Link>
                    ))}
                  </div>
                </nav>
              )}

              {p.porCantidad && !agotado(p) ? (
                <ElegirCantidad producto={p} />
              ) : (
                <BotonSumar id={p.id} nombre={p.nombre} grande agotado={agotado(p)} />
              )}
              {agotado(p) ? (
                <FormAvisoStock productoId={p.id} />
              ) : (
                <p className="producto__entrega">
                  {p.formato === "canva" ? ENTREGA_CANVA : seccion.entrega}
                  {p.tipo === "descargable" && p.formato !== "canva" && (
                    <>
                      {" "}
                      <Link href="/como-imprimir">Cómo imprimirlo</Link>.
                    </>
                  )}
                </p>
              )}

              {p.descripcion?.map((parrafo) => (
                <p key={parrafo}>{parrafo}</p>
              ))}

              {p.contenido && (
                <>
                  <h2>Qué trae</h2>
                  <ul className="producto__lista">
                    {p.contenido.map((cosa) => (
                      <li key={cosa}>{cosa}</li>
                    ))}
                  </ul>
                </>
              )}

              {caracteristicas.length > 0 && (
                <>
                  <h2>Características</h2>
                  <ul className="producto__lista">
                    {caracteristicas.map((dato) => (
                      <li key={dato}>{dato}</li>
                    ))}
                  </ul>
                </>
              )}

              {p.etiquetas && (
                <ul className="producto__etiquetas" aria-label="Etiquetas">
                  {p.etiquetas.map((e) => (
                    <li key={e}>
                      <Link className="filtro" href={rutaSeccion(e)}>
                        {e}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {p.muestras && (
        <Seccion nota="antes de comprarlo" titulo="Mirá por dentro" bajada="Algunas hojas de muestra. Tocá una para verla entera.">
          <PorDentro muestras={p.muestras} nombre={p.nombre} />
        </Seccion>
      )}

      {fotosClientas.length > 0 && (
        <Seccion cielo nota="fotos de quienes ya lo tienen" titulo="Así lo usan">
          <AsiLoUsan fotos={fotosClientas} />
        </Seccion>
      )}

      <section className="seccion resenas" id="resenas">
        <div className="contenedor">
          <div className="encabezado-seccion">
            <div>
              <span className="nota-mano">de quienes ya lo tienen</span>
              <h2>Reseñas</h2>
            </div>
          </div>
          <div className="resenas__grilla">
            <div className="resenas__lista">
              {resenas.length === 0 && <p className="resenas__vacio">Todavía no hay reseñas. ¿Lo tenés? Contanos qué te pareció.</p>}
              {resenas.map((r) => (
                <blockquote key={r.id} className="resena">
                  <p className="resena__estrellas" aria-label={`${r.puntaje} de 5 estrellas`}>
                    {estrellas(r.puntaje)}
                  </p>
                  <p>{r.texto}</p>
                  <footer>
                    — {r.nombre},{" "}
                    {new Date(r.creado_en).toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
                  </footer>
                </blockquote>
              ))}
            </div>
            <FormResena productoId={p.id} />
          </div>
        </div>
      </section>

      {parecidos.length > 0 && (
        <Seccion cielo nota="para seguir mirando" titulo="También te puede gustar">
          <div className="grilla-fichas grilla-fichas--cuatro">
            {parecidos.map((o, n) => (
              <Ficha key={o.id} producto={o} orden={n} />
            ))}
          </div>
        </Seccion>
      )}
    </>
  );
}
