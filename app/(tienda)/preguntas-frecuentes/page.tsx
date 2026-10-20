import type { Metadata } from "next";
import Link from "next/link";
import { Franja, Portadilla, Seccion } from "@/components/Bloques";
import { enlaceWhatsApp } from "@/lib/contacto";
import { pagoOnlineActivo } from "@/lib/mercadopago";
import { ABIERTAS } from "@/lib/paginas";
import { SOLO_CRESPO } from "@/lib/zonas";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Cómo hacer un pedido, medios de pago, envíos, retiro, descargables y cambios en Alas de Ángel Papelería.",
};

type Pregunta = [pregunta: string, respuesta: string];
type Tema = { id: string; titulo: string; preguntas: Pregunta[] };

/* Revisá que las respuestas sigan siendo ciertas cuando cambie algo (medios de pago, envíos, plazos). */
const TEMAS: Tema[] = [
  {
    id: "productos",
    titulo: "Nuestros productos",
    preguntas: [
      [
        "¿Los productos son hechos a mano?",
        "Sí. Cada cuaderno, agenda y cartuchera la armamos nosotras en el taller, de a poco y revisando cada detalle. Por eso puede haber pequeñas diferencias entre uno y otro: es parte de que esté hecho a mano.",
      ],
      [
        "¿Puedo encargar algo que no está en la página?",
        "Escribinos y lo charlamos. Si podemos hacerlo, te pasamos el precio y el plazo antes de empezar.",
      ],
      [
        "¿Cuándo suben productos nuevos?",
        "Vamos sumando de a poco. Anotate en las novedades por mail, al pie de la página, y te avisamos cada vez que sale algo nuevo.",
      ],
    ],
  },
  {
    id: "pedidos",
    titulo: "Pedidos y pagos",
    preguntas: [
      [
        "¿Cómo hago un pedido?",
        pagoOnlineActivo
          ? "Sumá lo que te guste a la bolsita y elegí: “Pagar con Mercado Pago” para pagar online en el momento, o “Enviar pedido por WhatsApp” si preferís coordinar con nosotras (se abre el chat con tu pedido ya escrito)."
          : "Sumá lo que te guste a la bolsita y tocá “Enviar pedido por WhatsApp”: se abre el chat con tu pedido ya escrito y ahí coordinamos el pago y la entrega.",
      ],
      [
        "¿Qué medios de pago aceptan?",
        pagoOnlineActivo
          ? "Online, con Mercado Pago: tarjeta de crédito, débito o dinero en cuenta. Si pedís por WhatsApp, también transferencia bancaria: te pasamos los datos por ahí."
          : "Transferencia bancaria o efectivo: cuando nos mandás el pedido por WhatsApp, te pasamos los datos por ahí.",
      ],
      [
        "¿Cuándo queda confirmado mi pedido?",
        pagoOnlineActivo
          ? "Cuando se acredita el pago. Si pagaste online, en el momento: te llega un mail con el detalle y el link para seguir tu pedido. Si pediste por WhatsApp, te avisamos por ahí apenas lo vemos."
          : "Cuando se acredita el pago: te avisamos por WhatsApp apenas lo vemos.",
      ],
      [
        "¿Tienen cupones de descuento?",
        pagoOnlineActivo
          ? "A veces, sobre todo para quienes se anotan en las novedades o nos siguen en Instagram. Si tenés uno, escribilo en la bolsita antes de pagar online y el descuento se aplica en el momento."
          : "A veces, sobre todo para quienes se anotan en las novedades o nos siguen en Instagram. Si tenés uno, pasánoslo por WhatsApp junto con el pedido y te lo descontamos.",
      ],
      [
        "Me equivoqué en el pedido, ¿lo puedo cambiar?",
        "Sí, avisanos lo antes posible por WhatsApp. Si todavía no lo despachamos, lo corregimos sin problema.",
      ],
      [
        "¿Venden por mayor?",
        "Sí, para comercios, souvenirs y eventos. Contanos qué productos te interesan y qué cantidad, y te armamos un presupuesto.",
      ],
    ],
  },
  {
    id: "envios",
    titulo: "Envíos y retiro",
    preguntas: [
      [
        "¿Hacen envíos?",
        SOLO_CRESPO
          ? "Por ahora, solo dentro de Crespo: elegí “Envío a domicilio” en la bolsita, mandanos el pedido por WhatsApp y ahí coordinamos el costo y el día. Muy pronto, también al resto del país."
          : "Sí, a todo el país. Si pagás online, el costo del envío aparece en la bolsita antes de pagar; si pedís por WhatsApp, te lo pasamos por ahí.",
      ],
      [
        "¿Puedo retirarlo en persona?",
        "Sí, estamos en Crespo, Entre Ríos. Coordinamos el día y el lugar por WhatsApp, sin costo. Y si sos de Crespo, también te lo llevamos a tu casa.",
      ],
      [
        "¿Cuánto tarda en llegar?",
        SOLO_CRESPO
          ? "Dentro de Crespo te lo llevamos nosotras: el día lo coordinamos por WhatsApp cuando nos mandás el pedido."
          : "Lo despachamos dentro de los tres días hábiles de acreditado el pago. Después depende del correo: cuando sale, te mandamos un mail con el número de seguimiento.",
      ],
      [
        "¿Es para regalo? ¿Lo pueden envolver?",
        "¡Claro! Avisanos al hacer el pedido y lo mandamos envuelto, con una tarjeta escrita a mano con el mensaje que quieras.",
      ],
    ],
  },
  {
    id: "descargables",
    titulo: "Descargables",
    preguntas: [
      [
        "¿Cómo recibo los archivos?",
        "Por mail, apenas se acredita el pago: te llegan los PDF adjuntos. Si en un rato no te llegó, fijate en la carpeta de spam o promociones antes de escribirnos.",
      ],
      [
        "¿Puedo imprimirlos más de una vez?",
        "Todas las veces que quieras, para uso personal. Lo que no se puede es compartir o revender el archivo, ni vender las hojas impresas.",
      ],
      [
        "¿Necesito algún programa especial?",
        "No. Son PDF: se abren en cualquier compu o celular. Los que dicen “editable” se completan con el lector de PDF gratuito de Adobe.",
      ],
    ],
  },
  {
    id: "cambios",
    titulo: "Cambios y problemas",
    preguntas: [
      ...(ABIERTAS.personalizados
        ? ([
            [
              "¿Cuánto demora un personalizado?",
              "Entre siete y diez días hábiles desde que aprobás la muestra. Si lo necesitás para una fecha, avisanos antes de pedirlo.",
            ],
          ] satisfies Pregunta[])
        : []),
      [
        "¿Puedo cambiar un producto?",
        `Sí, los productos físicos sin uso se pueden cambiar dentro de los diez días de recibidos. ${ABIERTAS.personalizados ? "Los personalizados y los descargables" : "Los descargables"} no tienen cambio, salvo que haya una falla nuestra.`,
      ],
      [
        "Me arrepentí de la compra, ¿la puedo cancelar?",
        "Sí, dentro de los 10 días corridos de recibida, desde el “Botón de arrepentimiento” que está al pie de todas las páginas. Te damos un código de trámite en el momento, el envío de vuelta corre por nuestra cuenta y te devolvemos el dinero. No aplica a los descargables.",
      ],
      [
        "Me llegó algo dañado, ¿qué hago?",
        "Mandanos una foto por WhatsApp apenas lo recibas y lo solucionamos: te lo reponemos o te devolvemos el dinero, como prefieras.",
      ],
    ],
  },
];

/* Para que Google pueda mostrar las preguntas en los resultados de búsqueda. */
function DatosParaGoogle() {
  const datos = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: TEMAS.flatMap((t) =>
      t.preguntas.map(([pregunta, respuesta]) => ({
        "@type": "Question",
        name: pregunta,
        acceptedAnswer: { "@type": "Answer", text: respuesta },
      })),
    ),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}

const WHATSAPP = enlaceWhatsApp("¡Hola Alas de Ángel! Tengo una consulta:");

export default function PreguntasFrecuentes() {
  return (
    <>
      <DatosParaGoogle />
      <Portadilla nota="lo que más nos preguntan" titulo="Preguntas frecuentes">
        Todo sobre pedidos, pagos, envíos y cambios. Si no encontrás lo que buscás, escribinos: te contesta una persona.
      </Portadilla>

      <Seccion>
        <div className="preguntas">
          <aside className="preguntas__lado">
            <nav aria-label="Temas">
              <span className="nota-mano">temas</span>
              <ul className="preguntas__indice">
                {TEMAS.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`}>{t.titulo}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="preguntas__ayuda">
              <p>¿No encontrás tu respuesta?</p>
              <a className="boton boton--chico" href={WHATSAPP} target="_blank" rel="noopener">
                Abrir WhatsApp
              </a>
            </div>
          </aside>

          <div className="preguntas__temas">
            {TEMAS.map((tema) => (
              <section key={tema.id} id={tema.id} className="preguntas__tema" aria-labelledby={`${tema.id}-titulo`}>
                <h2 id={`${tema.id}-titulo`}>{tema.titulo}</h2>
                {tema.preguntas.map(([pregunta, respuesta]) => (
                  <details key={pregunta} name={tema.id}>
                    <summary>{pregunta}</summary>
                    <p>{respuesta}</p>
                  </details>
                ))}
              </section>
            ))}
          </div>
        </div>
      </Seccion>

      <Seccion>
        <Franja
          titulo="¿Te quedó una duda?"
          accion={
            <div className="fila-botones">
              <a className="boton" href={WHATSAPP} target="_blank" rel="noopener">
                Escribinos por WhatsApp
              </a>
              <Link className="boton boton--claro" href="/contacto">
                Otras formas de contacto
              </Link>
            </div>
          }
        >
          Preguntanos lo que necesites. Te contesta una persona, no un robot.
        </Franja>
      </Seccion>
    </>
  );
}
