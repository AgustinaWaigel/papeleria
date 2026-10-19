import type { Metadata } from "next";
import Link from "next/link";
import { Franja, Portadilla, Seccion } from "@/components/Bloques";
import { Estanteria } from "@/components/Estanteria";
import { ABIERTAS } from "@/lib/paginas";

export const metadata: Metadata = {
  title: "Papelería",
  description: "Cuadernos, agendas, stickers, washi tapes, lapiceras y tarjetas. Catálogo de papelería de Alas de Ángel.",
};

export default function Papeleria() {
  return (
    <>
      <Portadilla nota="para organizarte, divertirte o regalar (te)" titulo="Papelería">
        Cuadernos, agendas, stickers y todo lo que hace falta para que escribir a mano vuelva a dar ganas. Te lo mandamos
        envuelto a tu casa.
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
