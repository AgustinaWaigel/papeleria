import Link from "next/link";
import { Franja, Seccion } from "@/components/Bloques";
import { hayIlustracion, Ilustracion } from "@/components/Alas";
import { TallerPortada } from "@/components/EnElTaller";
import { Ficha } from "@/components/Ficha";
import { AsiLoUsan } from "@/components/AsiLoUsan";
import { obtenerCatalogo, obtenerFotosClientas, obtenerSecciones } from "@/lib/catalogo";
import { CONTACTO, enlaceInstagram } from "@/lib/contacto";
import { pagoOnlineActivo } from "@/lib/mercadopago";
import { ABIERTAS, visible } from "@/lib/paginas";
import { tieneEtiqueta, unoPorFormato } from "@/lib/productos";
import { CATALOGO, MARCA, PORTADA } from "@/lib/marca";
import { SITIO_URL } from "@/lib/sitio";

const ESTANTES = [
  {
    href: CATALOGO.ruta,
    pestana: "Para tocar",
    titulo: CATALOGO.nombre,
    texto: CATALOGO.texto,
    ir: CATALOGO.boton,
  },
  {
    href: "/descargables",
    pestana: "Para imprimir",
    titulo: "Descargables",
    texto: "Planners, hojas de estudio y kits de festejo en PDF. Te llegan por mail apenas pagás.",
    ir: "Ver plantillas",
  },
  {
    href: "/personalizados",
    pestana: "A tu medida",
    titulo: "Personalizados",
    texto: "Contanos tu idea, con tu nombre y tu estilo, y te lo hacemos a medida. Antes, te mostramos una muestra.",
    ir: "Contar mi idea",
  },
  {
    href: "/packs-regalo",
    pestana: "Para regalar",
    titulo: "Packs regalo",
    texto: "Combos ya armados y envueltos, listos para regalar.",
    ir: "Ver packs",
  },
];

const PASOS = [
  [
    "Llená tu bolsita",
    ABIERTAS.descargables
      ? "Sumá lo que te guste: productos físicos y descargables pueden ir juntos en el mismo pedido."
      : "Sumá lo que te guste y elegí la cantidad de cada cosa.",
  ],
  pagoOnlineActivo
    ? ["Pagá o escribinos", "Pagá online con Mercado Pago en el momento, o mandanos el pedido por WhatsApp y coordinamos el pago y el envío."]
    : ["Mandanos tu pedido", "Elegí cómo lo recibís (te mostramos el costo del envío) y mandanos el pedido por WhatsApp: te pasamos los datos para la transferencia."],
  [
    "Recibilo",
    ABIERTAS.descargables
      ? "Lo físico viaja envuelto a tu casa. Los descargables te llegan por mail apenas se acredita el pago."
      : "Te lo llevamos a tu casa o lo retirás, como te quede mejor.",
  ],
];

/* Le dice a Google cómo se llama el sitio y quién está detrás, para que aparezca al buscar la marca
   (con o sin tilde) y muestre su nombre como nombre del sitio en los resultados. */
function DatosMarca() {
  const datos = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITIO_URL}/#sitio`,
        url: `${SITIO_URL}/`,
        name: MARCA.completo,
        alternateName: [...new Set([MARCA.nombre, MARCA.nombreArchivo, `${MARCA.nombreArchivo} ${MARCA.rubro}`.trim()])],
        inLanguage: "es-AR",
        publisher: { "@id": `${SITIO_URL}/#marca` },
      },
      {
        "@type": "Organization",
        "@id": `${SITIO_URL}/#marca`,
        name: MARCA.completo,
        alternateName: MARCA.nombreArchivo,
        url: `${SITIO_URL}/`,
        email: CONTACTO.email,
        sameAs: [enlaceInstagram],
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}

export default async function Inicio() {
  const catalogo = await obtenerCatalogo();
  // Sin productos cargados, la tienda se muestra "en el taller".
  if (catalogo.length === 0)
    return (
      <>
        <DatosMarca />
        <EnConstruccion />
      </>
    );

  // Los que se marcaron "En Inicio" en el panel; si no hay ninguno, los primeros del catálogo.
  const destacados = catalogo.filter((p) => p.destacado);
  const enInicio = unoPorFormato(destacados.length > 0 ? destacados : catalogo).slice(0, 8);
  const secciones = (await obtenerSecciones()).filter((s) => catalogo.some((p) => tieneEtiqueta(p, s.id)));
  const fotosClientas = await obtenerFotosClientas();
  // Las secciones cerradas no figuran; personalizados y packs, si están cerradas, aparecen como "Próximamente"
  // solo en la papelería original (en otros rubros puede que nunca existan).
  const estantes = ESTANTES.filter((e) => visible(e.href) || (MARCA.rubroId === "papeleria" && e.href !== "/descargables"));

  return (
    <>
      <DatosMarca />
      <section className="portada">
        <div className={hayIlustracion ? "contenedor portada__grilla" : "contenedor portada__grilla portada__grilla--sola"}>
          <div className="portada__texto">
            {MARCA.nota && <span className="nota-mano">{MARCA.nota}</span>}
            <h1>
              {PORTADA.titulo} {PORTADA.resalte && <span className="resalte">{PORTADA.resalte}</span>}
            </h1>
            {PORTADA.texto && <p>{PORTADA.texto}</p>}
            <div className="fila-botones">
              <Link className="boton" href={CATALOGO.ruta}>
                {CATALOGO.boton}
              </Link>
              {visible("/descargables") && (
                <Link className="boton boton--claro" href="/descargables">
                  Ver descargables
                </Link>
              )}
            </div>
          </div>
          {hayIlustracion && (
            <div className="portada__dibujo">
              <Ilustracion />
            </div>
          )}
        </div>
      </section>

      <Seccion
        nota={PORTADA.notaDestacados}
        titulo={PORTADA.tituloDestacados}
        accion={
          <Link className="boton boton--claro" href={catalogo.some((p) => p.tipo === "fisico") || !visible("/descargables") ? CATALOGO.ruta : "/descargables"}>
            Ver todo
          </Link>
        }
      >
        <div className="grilla-fichas grilla-fichas--cuatro">
          {enInicio.map((p, n) => (
            <Ficha key={p.id} producto={p} orden={n} />
          ))}
        </div>
      </Seccion>

      {secciones.length > 0 && (
        <Seccion nota="¿para qué lo necesitás?" titulo="Buscá por sección">
          <nav className="filtros filtros--grandes" aria-label="Secciones">
            {secciones.map((s) => (
              <Link key={s.id} className="filtro" href={`/seccion/${s.id}`}>
                {s.nombre}
              </Link>
            ))}
          </nav>
        </Seccion>
      )}

      {ABIERTAS.listas && (
      <Seccion>
        <Franja
          titulo="¿Tenés la lista de útiles del cole?"
          accion={
            <Link className="boton" href="/listas-escolares">
              Armar mi lista
            </Link>
          }
        >
          Pegala tal cual te la mandaron y te armamos la bolsita con todo lo que tenemos, para tu hijo o para todo el grado.
        </Franja>
      </Seccion>
      )}

      {estantes.length > 1 && (
      <Seccion nota="por dónde empezar" titulo="Elegí por dónde arrancar">
        <div className="estantes">
          {estantes.map((e) => (
            <Link
              key={e.href}
              className={visible(e.href) ? "estante" : "estante estante--pronto"}
              href={e.href}
              data-pestana={visible(e.href) ? e.pestana : "Próximamente"}
            >
              <h3>{e.titulo}</h3>
              <p>{e.texto}</p>
              <span className="estante__ir">{visible(e.href) ? e.ir : "Lo estamos preparando"}</span>
            </Link>
          ))}
        </div>
      </Seccion>
      )}

      {fotosClientas.length > 0 && (
        <Seccion nota="fotos de nuestras clientas" titulo="Así lo usan">
          <AsiLoUsan fotos={fotosClientas.slice(0, 8)} conProducto={new Map(catalogo.map((p) => [p.id, p.nombre]))} />
        </Seccion>
      )}

      <Seccion cielo nota="así de simple" titulo="Cómo comprar">
        <ol className="pasos">
          {PASOS.map(([titulo, texto]) => (
            <li key={titulo}>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </li>
          ))}
        </ol>
      </Seccion>

      {ABIERTAS.personalizados && (
        <Seccion>
          <Franja
            titulo="¿Lo querés con tu nombre?"
            accion={
              <Link className="boton" href="/personalizados">
                Pedir mi personalizado
              </Link>
            }
          >
            Contanos cómo te lo imaginás y te lo hacemos a medida. Antes de hacerlo, te mostramos una muestra.
          </Franja>
        </Seccion>
      )}
    </>
  );
}

function EnConstruccion() {
  return (
    <>
      <TallerPortada />

      <Seccion cielo nota="mientras tanto" titulo="Cómo vamos a trabajar">
        <ol className="pasos">
          {PASOS.map(([titulo, texto]) => (
            <li key={titulo}>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </li>
          ))}
        </ol>
      </Seccion>

      {ABIERTAS.personalizados && (
        <Seccion>
          <Franja
            titulo="¿No querés esperar?"
            accion={
              <Link className="boton" href="/personalizados">
                Pedir mi personalizado
              </Link>
            }
          >
            Los personalizados ya se pueden pedir: contanos tu idea y nos llega por WhatsApp.
          </Franja>
        </Seccion>
      )}
    </>
  );
}
