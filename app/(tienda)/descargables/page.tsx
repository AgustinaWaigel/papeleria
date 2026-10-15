import type { Metadata } from "next";
import Link from "next/link";
import { Portadilla, Seccion } from "@/components/Bloques";
import { Estanteria } from "@/components/Estanteria";
import { ABIERTAS } from "@/lib/paginas";

export const metadata: Metadata = {
  title: "Descargables",
  description: "Planners, hojas de estudio, plantillas para la casa y kits de festejo en PDF para imprimir.",
};

const AVISOS = [
  { giro: "[--giro:-1deg]", titulo: "Se imprimen en cualquier impresora", texto: "Están pensados para A4 común. Los que también vienen en A5 lo dicen en la ficha." },
  { giro: "[--giro:1deg]", titulo: "Son para uso personal", texto: "Podés imprimirlos las veces que quieras para vos y tu familia. No se pueden revender ni compartir el archivo." },
  { giro: "[--giro:-0.5deg]", titulo: "No tienen cambio", texto: "Como son archivos, una vez enviados no hay devolución. Si algo no abre o se ve mal, escribinos y lo resolvemos." },
];

export default function Descargables() {
  return (
    <>
      <Portadilla nota="de la pantalla a la hoja" titulo="Descargables para imprimir">
        Plantillas en PDF que imprimís en tu casa o en la librería de la esquina, todas las veces que quieras. Te llegan por
        mail apenas se acredita el pago.
      </Portadilla>

      <Seccion>
        <Estanteria tipo="descargable" />
      </Seccion>

      <Seccion cielo nota="antes de imprimir" titulo="Tres cosas que conviene saber">
        <div className="grilla-notas">
          {AVISOS.map((a) => (
            <div key={a.titulo} className={`papelito [--fondo:var(--color-nube)] ${a.giro}`}>
              <h3>{a.titulo}</h3>
              <p>{a.texto}</p>
            </div>
          ))}
        </div>
        {ABIERTAS.ideas && (
          <p className="mt-e7">
            ¿Primera vez imprimiendo plantillas? Leé{" "}
            <Link href="/cuaderno-de-ideas#imprimir-en-casa">cómo imprimir en casa y que quede lindo</Link>.
          </p>
        )}
      </Seccion>
    </>
  );
}
