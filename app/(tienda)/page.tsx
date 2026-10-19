import Link from "next/link";
import { Franja, Seccion } from "@/components/Bloques";
import { AlasAnimadas } from "@/components/Alas";
import { TallerPortada } from "@/components/EnElTaller";
import { Ficha } from "@/components/Ficha";
import { obtenerCatalogo } from "@/lib/catalogo";
import { CONTACTO, enlaceInstagram } from "@/lib/contacto";
import { ABIERTAS, visible } from "@/lib/paginas";
import { SITIO_URL } from "@/lib/sitio";

const ESTANTES = [
  {
    href: "/papeleria",
    pestana: "Para tocar",
    titulo: "Papelería",
    texto: "Cuadernos cosidos, agendas, stickers, washi tapes y lapiceras. Te llegan a tu casa.",
    ir: "Ver productos",
  },
  {
    href: "/descargables",
    pestana: "Para imprimir",
    titulo: "Descargables",
    texto: "Planners, hojas de estudio y kits de festejo en PDF. Los pedís y te llegan por mail.",
    ir: "Ver plantillas",
  },
  {
    href: "/personalizados",
    pestana: "A tu medida",
    titulo: "Personalizados",
    texto: "Elegí el color de la tapa, el dibujo y el nombre. Mirás cómo queda antes de pedirlo.",
    ir: "Armar el mío",
  },
  {
    href: "/packs-regalo",
    pestana: "Para regalar",
    titulo: "Packs regalo",
    texto: "Combos ya armados y envueltos, con una tarjeta escrita a mano.",
    ir: "Ver packs",
  },
];

const PASOS = [
  ["Llená tu bolsita", "Sumá lo que te guste: productos físicos y descargables pueden ir juntos en el mismo pedido."],
  ["Mandanos el pedido", "Con un toque se abre WhatsApp con todo ya escrito. Ahí coordinamos el pago y el envío."],
  ["Recibilo", "Lo físico viaja envuelto a tu casa. Los descargables te llegan por mail apenas se acredita el pago."],
];

/* Le dice a Google cómo se llama el sitio y quién está detrás, para que aparezca al buscar la marca
   (con o sin tilde) y muestre "Alas de Ángel" como nombre del sitio en los resultados. */
function DatosMarca() {
  const datos = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITIO_URL}/#sitio`,
        url: `${SITIO_URL}/`,
        name: "Alas de Ángel Papelería",
        alternateName: ["Alas de Ángel", "Alas de Angel", "Alas de Angel Papelería"],
        inLanguage: "es-AR",
        publisher: { "@id": `${SITIO_URL}/#marca` },
      },
      {
        "@type": "Organization",
        "@id": `${SITIO_URL}/#marca`,
        name: "Alas de Ángel Papelería",
        alternateName: "Alas de Angel",
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
  const enInicio = (destacados.length > 0 ? destacados : catalogo).slice(0, 8);

  return (
    <>
      <DatosMarca />
      <section className="portada">
        <div className="contenedor portada__grilla">
          <div className="portada__texto">
            <span className="nota-mano">papelería creativa</span>
            <h1>
              Para escribir, soñar y <span className="resalte">volar.</span>
            </h1>
            <p>
              Papelería hecha a mano, con mucho amor. Cuadernos, agendas, cartucheras y detalles para acompañar tus
              días.
            </p>
            <div className="fila-botones">
              <Link className="boton" href="/papeleria">
                Ver la papelería
              </Link>
              <Link className="boton boton--claro" href="/descargables">
                Ver descargables
              </Link>
            </div>
          </div>
          <div className="portada__dibujo">
            <AlasAnimadas />
          </div>
        </div>
      </section>

      <Seccion
        nota="recién salidos del taller"
        titulo="Lo que hay en la mesa"
        accion={
          <Link className="boton boton--claro" href={catalogo.some((p) => p.tipo === "fisico") ? "/papeleria" : "/descargables"}>
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

      <Seccion nota="por dónde empezar" titulo="Cuatro estantes para revolver">
        <div className="estantes">
          {ESTANTES.map((e) => (
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
                Armar mi personalizado
              </Link>
            }
          >
            Armá tu cuaderno o agenda: elegís color, dibujo e interior, y ves cómo queda antes de pedirlo.
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
                Armar mi personalizado
              </Link>
            }
          >
            Los personalizados ya se pueden pedir: elegís color, dibujo e interior, y nos lo mandás por WhatsApp.
          </Franja>
        </Seccion>
      )}
    </>
  );
}
