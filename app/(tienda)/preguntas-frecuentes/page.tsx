import type { Metadata } from "next";
import Link from "next/link";
import { Franja, Portadilla, Seccion } from "@/components/Bloques";
import { ABIERTAS } from "@/lib/paginas";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Envíos, pagos, descargables y cambios.",
};

/* Respuestas de ejemplo: revisalas y ajustalas a cómo trabajan de verdad (envíos, pagos, plazos). */
const TEMAS = [
  {
    titulo: "Compras y pagos",
    preguntas: [
      ["¿Cómo compro?", "Sumás lo que quieras a la bolsita y tocás “Enviar pedido por WhatsApp”. Se abre el chat con tu pedido ya escrito; ahí te confirmamos el stock y te pasamos los datos para pagar."],
      ["¿Qué medios de pago aceptan?", "Transferencia bancaria y Mercado Pago. Te pasamos los datos por WhatsApp cuando confirmamos el pedido."],
      ["¿Venden por mayor?", "Sí, para comercios y para eventos. Escribinos contando qué productos te interesan y qué cantidad, y te armamos un presupuesto."],
    ],
  },
  {
    titulo: "Envíos",
    preguntas: [
      ["¿Hacen envíos?", "Sí, a todo el país por correo. El costo depende del destino y del tamaño del paquete: te lo pasamos antes de que pagues."],
      ["¿Cuánto tarda en llegar?", "Despachamos dentro de los tres días hábiles de acreditado el pago. Después depende del correo; te mandamos el código de seguimiento para que lo veas."],
    ],
  },
  {
    titulo: "Descargables",
    preguntas: [
      ["¿Cómo recibo los archivos?", "Por mail, apenas se acredita el pago. Si en un rato no lo ves, fijate en la carpeta de spam antes de escribirnos."],
      ["¿Puedo imprimirlos más de una vez?", "Todas las que quieras, para uso personal. Lo que no se puede es revender el archivo, compartirlo ni vender las hojas impresas."],
      ["¿Necesito un programa especial?", "No. Son PDF: se abren en cualquier compu o celular. Los que dicen “editable” se completan con el lector de PDF gratuito de Adobe."],
    ],
  },
  {
    titulo: ABIERTAS.personalizados ? "Personalizados y cambios" : "Cambios",
    preguntas: [
      ...(ABIERTAS.personalizados
        ? [["¿Cuánto demora un personalizado?", "Entre siete y diez días hábiles desde que aprobás la muestra. Si lo necesitás para una fecha, avisanos antes de pedirlo."] as [string, string]]
        : []),
      ["¿Puedo cambiar un producto?", `Los productos físicos sin uso se pueden cambiar dentro de los diez días de recibidos. ${ABIERTAS.personalizados ? "Los personalizados y los descargables" : "Los descargables"} no tienen cambio, salvo que haya una falla nuestra.`],
      ["Me llegó algo dañado, ¿qué hago?", "Mandanos una foto por WhatsApp apenas lo recibas y te lo reponemos."],
    ],
  },
];

export default function PreguntasFrecuentes() {
  return (
    <>
      <Portadilla nota="lo que más nos preguntan" titulo="Preguntas frecuentes">
        Envíos, pagos, descargables y cambios. Si no encontrás lo que buscás, escribinos.
      </Portadilla>

      <Seccion>
        <div className="preguntas">
          {TEMAS.map((tema) => (
            <div key={tema.titulo}>
              <h2>{tema.titulo}</h2>
              {tema.preguntas.map(([pregunta, respuesta]) => (
                <details key={pregunta}>
                  <summary>{pregunta}</summary>
                  <p>{respuesta}</p>
                </details>
              ))}
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion>
        <Franja
          titulo="¿Te quedó una duda?"
          accion={
            <Link className="boton" href="/contacto">
              Escribinos
            </Link>
          }
        >
          Preguntanos lo que necesites: te contesta una persona.
        </Franja>
      </Seccion>
    </>
  );
}
