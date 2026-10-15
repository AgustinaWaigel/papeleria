import Link from "next/link";
import { enlaceInstagram } from "@/lib/contacto";
import { ABIERTAS } from "@/lib/paginas";
import { AlasAnimadas } from "./Alas";
import { Portadilla, Seccion } from "./Bloques";

/* Lo que se ve mientras no hay productos cargados: la tienda "en el taller". */

const NOVEDADES = "#novedades"; // el formulario de suscripción del pie

export function TallerPortada() {
  return (
    <section className="portada">
      <div className="contenedor portada__grilla">
        <div className="portada__texto">
          <span className="nota-mano">en el taller</span>
          <h1>
            Estamos fabricando algo <span className="resalte">lindo.</span>
          </h1>
          <p>
            Cosemos cuadernos, armamos agendas y diseñamos plantillas para imprimir. Muy pronto vas a poder verlos y
            pedirlos acá.
          </p>
          <div className="fila-botones">
            <a className="boton" href={NOVEDADES}>
              Avisame cuando abran
            </a>
            <a className="boton boton--claro" href={enlaceInstagram} target="_blank" rel="noopener">
              Ver el Instagram
            </a>
          </div>
        </div>
        <div className="portada__dibujo">
          <AlasAnimadas />
          <span className="nota-mano">aguja, hilo y paciencia</span>
        </div>
      </div>
    </section>
  );
}

export function TallerAviso() {
  return (
    <div className="taller">
      <span className="nota-mano">en el taller</span>
      <h2>Todavía lo estamos fabricando</h2>
      <p>Esta sección se llena muy pronto. Dejanos tu mail y te avisamos apenas esté lista.</p>
      <div className="fila-botones">
        <a className="boton" href={NOVEDADES}>
          Avisame
        </a>
        {ABIERTAS.personalizados ? (
          <Link className="boton boton--claro" href="/personalizados">
            Pedir un personalizado
          </Link>
        ) : (
          <a className="boton boton--claro" href={enlaceInstagram} target="_blank" rel="noopener">
            Ver el Instagram
          </a>
        )}
      </div>
    </div>
  );
}

/* Para las secciones guardadas para más adelante (ver lib/paginas.ts). */
export function Proximamente({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <>
      <Portadilla nota="próximamente" titulo={titulo}>
        {children}
      </Portadilla>
      <Seccion>
        <div className="taller">
          <span className="nota-mano">trabajando en el taller</span>
          <h2>Muy pronto vas a poder pedirlo</h2>
          <p>Lo estamos preparando con tiempo y cariño. Dejanos tu mail y te avisamos apenas esté listo.</p>
          <div className="fila-botones">
            <a className="boton" href={NOVEDADES}>
              Avisame
            </a>
            <a className="boton boton--claro" href={enlaceInstagram} target="_blank" rel="noopener">
              Ver el Instagram
            </a>
          </div>
        </div>
      </Seccion>
    </>
  );
}
