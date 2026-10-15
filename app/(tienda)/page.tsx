import Link from "next/link";
import { Franja, Seccion } from "@/components/Bloques";
import { Destacados } from "@/components/Estanteria";
import { AlasAnimadas } from "@/components/Alas";
import { TallerPortada } from "@/components/EnElTaller";
import { obtenerCatalogo } from "@/lib/catalogo";

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
  [
    "Llená tu bolsita",
    "Sumá lo que te guste: productos físicos, descargables y packs pueden ir juntos en el mismo pedido.",
  ],
  ["Mandanos el pedido", "Con un toque se abre WhatsApp con todo ya escrito. Ahí coordinamos el pago y el envío."],
  ["Recibilo", "Lo físico viaja envuelto a tu casa. Los descargables te llegan por mail apenas se acredita el pago."],
];

const NOTAS = [
  {
    href: "/cuaderno-de-ideas#estrenar-cuaderno",
    tema: "Empezar",
    lomo: "[--lomo:var(--color-lavanda)]",
    titulo: "Cómo estrenar un cuaderno sin miedo a arruinarlo",
    texto: "La primera hoja en blanco intimida. Cinco maneras de romper el hielo.",
  },
  {
    href: "/cuaderno-de-ideas#semana-en-una-hoja",
    tema: "Organización",
    lomo: "[--lomo:var(--color-halo)]",
    titulo: "Una semana entera en una sola hoja",
    texto: "El método de las tres prioridades para planificar en diez minutos.",
  },
  {
    href: "/cuaderno-de-ideas#imprimir-en-casa",
    tema: "Descargables",
    lomo: "[--lomo:var(--color-menta)]",
    titulo: "Imprimir en casa y que quede lindo",
    texto: "Qué papel usar, cómo configurar la impresora y cómo encuadernar sin anilladora.",
  },
];

export default async function Inicio() {
  const catalogo = await obtenerCatalogo();
  // Sin productos cargados, la tienda se muestra "en el taller".
  if (catalogo.length === 0) return <EnConstruccion />;
  const conDestacados = (tipo: string) => catalogo.some((p) => p.tipo === tipo && p.destacado);

  return (
    <>
      <section className="portada">
        <svg className="cintas" viewBox="0 0 400 560" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
          {[
            ["c-vino", undefined, undefined],
            ["c-rosa", "14 86", -18],
            ["c-lima", "16 84", -44],
            ["c-verde", "14 86", -72],
          ].map(([color, tramo, desde]) => (
            <path
              key={color}
              className={color as string}
              pathLength={100}
              strokeDasharray={tramo}
              strokeDashoffset={desde}
              d="M330,-30 C330,90 150,70 150,190 C150,300 340,280 340,400 C340,500 220,520 200,600"
            />
          ))}
        </svg>
        <div className="contenedor portada__grilla">
          <div className="portada__texto">
            <span className="nota-mano">papelería creativa</span>
            <h1>
              Papel para ideas que quieren <span className="resalte">volar.</span>
            </h1>
            <p>Cuadernos, agendas y stickers para tener en la mano, y plantillas para imprimir en casa hoy mismo.</p>
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
            <span className="nota-mano">cada hoja, un ala</span>
          </div>
        </div>
      </section>

      <Seccion nota="por dónde empezar" titulo="Cuatro estantes para revolver">
        <div className="estantes">
          {ESTANTES.map((e) => (
            <Link key={e.href} className="estante" href={e.href} data-pestana={e.pestana}>
              <h3>{e.titulo}</h3>
              <p>{e.texto}</p>
              <span className="estante__ir">{e.ir}</span>
            </Link>
          ))}
        </div>
      </Seccion>

      {conDestacados("fisico") && (
        <Seccion
          cielo
          nota="los más pedidos"
          titulo="Recién salidos del taller"
          accion={
            <Link className="boton boton--claro" href="/papeleria">
              Ver toda la papelería
            </Link>
          }
        >
          <Destacados tipo="fisico" />
        </Seccion>
      )}

      {conDestacados("descargable") && (
        <Seccion
          nota="sin esperar al correo"
          titulo="Imprimí en casa y empezá hoy"
          bajada="Plantillas en PDF listas para imprimir en A4 o A5, todas las veces que quieras."
          accion={
            <Link className="boton boton--claro" href="/descargables">
              Ver todos los descargables
            </Link>
          }
        >
          <Destacados tipo="descargable" />
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

      <Seccion
        nota="para leer con un mate"
        titulo="Del cuaderno de ideas"
        accion={
          <Link className="boton boton--claro" href="/cuaderno-de-ideas">
            Leer todas las notas
          </Link>
        }
      >
        <div className="grilla-notas">
          {NOTAS.map((n) => (
            <Link key={n.href} className={`tarjeta-nota ${n.lomo}`} href={n.href}>
              <span className="tarjeta-nota__tema">{n.tema}</span>
              <h3>{n.titulo}</h3>
              <p>{n.texto}</p>
            </Link>
          ))}
        </div>
      </Seccion>

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

      <Seccion
        nota="para leer con un mate"
        titulo="Del cuaderno de ideas"
        accion={
          <Link className="boton boton--claro" href="/cuaderno-de-ideas">
            Leer todas las notas
          </Link>
        }
      >
        <div className="grilla-notas">
          {NOTAS.map((n) => (
            <Link key={n.href} className={`tarjeta-nota ${n.lomo}`} href={n.href}>
              <span className="tarjeta-nota__tema">{n.tema}</span>
              <h3>{n.titulo}</h3>
              <p>{n.texto}</p>
            </Link>
          ))}
        </div>
      </Seccion>

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
    </>
  );
}
