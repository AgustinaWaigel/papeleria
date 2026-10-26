import type { Metadata } from "next";
import Link from "next/link";
import { Portadilla, Seccion } from "@/components/Bloques";
import { FormPresupuesto } from "@/components/FormPresupuesto";
import { ABIERTAS } from "@/lib/paginas";

export const metadata: Metadata = {
  title: "Pedidos por mayor",
  description:
    "Papelería por cantidad para emprendimientos, escuelas, docentes y eventos: cuadernos con tu logo, agendas para equipos y souvenirs. Pedí tu presupuesto.",
};

const PARA_QUIEN = [
  {
    giro: "[--giro:-1deg]",
    titulo: "Emprendimientos",
    texto: "Tarjetas, etiquetas, stickers con tu logo, cuadernos para tus clientas o agendas para tu equipo.",
  },
  {
    giro: "[--giro:1deg]",
    titulo: "Escuelas y docentes",
    texto: "Cuadernos y agendas para todo el grado, regalos de fin de año, kits para la vuelta al cole.",
  },
  {
    giro: "[--giro:-0.5deg]",
    titulo: "Eventos",
    texto: "Souvenirs de cumpleaños, comuniones y egresados: libretas, tarjetas y packs con nombre.",
  },
];

export default function PedidosPorMayor() {
  return (
    <>
      <Portadilla nota="de a muchos" titulo="Pedidos por mayor">
        Para emprendimientos, escuelas y eventos. Contanos qué necesitás y cuántos, y te pasamos precio y fecha de
        entrega.
      </Portadilla>

      <Seccion>
        <div className="grilla-notas">
          {PARA_QUIEN.map((p) => (
            <div key={p.titulo} className={`papelito [--fondo:var(--color-nube)] ${p.giro}`}>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion cielo>
        <div className="dos-columnas">
          <div className="prosa">
            <h2>Cómo funciona</h2>
            <p>
              Completá el formulario y te damos un <strong>número de pedido</strong> en el momento. En uno o dos días
              hábiles te escribimos con el presupuesto, la muestra y los tiempos.
            </p>
            <p>
              ¿Lo que necesitás ya está en la tienda? Muchos productos tienen <strong>precio por cantidad</strong>: elegí
              x10 o x20 en el producto y el descuento se aplica solo. Mirá las secciones{" "}
              <Link href="/seccion/emprendedores">Emprendedores</Link> y <Link href="/seccion/escuela">Escuela</Link>.
            </p>
            {ABIERTAS.listas && (
              <p>
                ¿Tenés la lista de útiles del cole? Pegala en <Link href="/listas-escolares">listas escolares</Link> y te
                armamos la bolsita.
              </p>
            )}
          </div>
          <FormPresupuesto />
        </div>
      </Seccion>
    </>
  );
}
