import type { Metadata } from "next";
import Link from "next/link";
import { Franja, Portadilla, Seccion } from "@/components/Bloques";
import { Estanteria } from "@/components/Estanteria";
import { ABIERTAS } from "@/lib/paginas";
import { MARCA, CATALOGO } from "@/lib/marca";

export const metadata: Metadata = {
  title: CATALOGO.nombre,
  description: `${CATALOGO.texto} Catálogo de ${MARCA.completo}.`,
};

export default function Papeleria() {
  return (
    <>
      <Portadilla chica nota={CATALOGO.nota} titulo={CATALOGO.nombre}>
        {CATALOGO.intro}
      </Portadilla>

      <Seccion>
        <Estanteria tipo="fisico" />
      </Seccion>

      {ABIERTAS.packs && (
      <Seccion>
        <Franja
          titulo="¿Buscás algo para regalar?"
          accion={
            <Link className="boton" href="/packs-regalo">
              Ver packs regalo
            </Link>
          }
        >
          Los packs ya vienen combinados y envueltos, con una tarjeta escrita a mano.
        </Franja>
      </Seccion>
      )}
    </>
  );
}
