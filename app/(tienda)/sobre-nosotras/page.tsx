import type { Metadata } from "next";
import Link from "next/link";
import { Franja, Portadilla, Seccion } from "@/components/Bloques";

export const metadata: Metadata = {
  title: "Sobre nosotras",
  description: "Quiénes estamos detrás de Alas de Ángel y cómo trabajamos.",
};

const PRINCIPIOS = [
  { fondo: "[--fondo:var(--color-lavanda-suave)]", giro: "[--giro:-1.5deg]", titulo: "Papel que se usa", texto: "Diseñamos para escribir, tachar y volver a empezar. Si un cuaderno da miedo estrenarlo, lo hicimos mal." },
  { fondo: "[--fondo:var(--color-halo-suave)]", giro: "[--giro:1deg]", titulo: "Hecho de a poco", texto: "Tiradas chicas, revisadas una por una. Preferimos quedarnos sin stock antes que mandar algo torcido." },
  { fondo: "[--fondo:var(--color-menta-suave)]", giro: "[--giro:-0.5deg]", titulo: "Del otro lado hay alguien", texto: "Cada pedido lo arma, lo envuelve y lo responde una persona. Si tenés una duda, te contestamos nosotras." },
];

export default function SobreNosotras() {
  return (
    <>
      <Portadilla nota="mucho gusto" titulo="Sobre nosotras">
        Alas de Ángel es una papelería chica, hecha por gente que todavía anota todo a mano.
      </Portadilla>

      <Seccion>
        <div className="dos-columnas">
          {/* Texto de ejemplo: reemplazalo por la historia real del emprendimiento. */}
          <div className="prosa">
            <h2>Por qué “alas”</h2>
            <p>
              Un cuaderno abierto tiene dos alas. Nos gusta pensar que por eso las ideas levantan vuelo cuando se escriben:
              mientras están en la cabeza dan vueltas; cuando llegan al papel, van a algún lado.
            </p>
            <p>
              Hacemos cuadernos, agendas y stickers para acompañar ese momento, y plantillas para imprimir para quien quiere
              empezar hoy sin esperar al correo.
            </p>
            <h2>Cómo trabajamos</h2>
            <p>
              Diseñamos cada producto nosotras, desde la tapa hasta el renglón. Los personalizados se hacen por pedido, y
              antes de imprimir siempre mandamos una muestra para que la apruebes.
            </p>
            <p>
              Si querés saber algo más, <Link href="/contacto">escribinos</Link>. Nos encanta hablar de papel.
            </p>
          </div>

          <div className="pila-papelitos">
            {PRINCIPIOS.map((p) => (
              <div key={p.titulo} className={`papelito ${p.fondo} ${p.giro}`}>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </Seccion>

      <Seccion>
        <Franja
          titulo="Pasá a ver lo que hacemos"
          accion={
            <Link className="boton" href="/papeleria">
              Ver la papelería
            </Link>
          }
        >
          Lo mejor para conocernos es abrir uno de nuestros cuadernos.
        </Franja>
      </Seccion>
    </>
  );
}
