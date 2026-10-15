import type { Metadata } from "next";
import Link from "next/link";
import { Portadilla, Seccion } from "@/components/Bloques";
import { Estanteria } from "@/components/Estanteria";

export const metadata: Metadata = {
  title: "Packs regalo",
  description: "Combos de papelería ya armados y envueltos, con tarjeta escrita a mano.",
};

export default function PacksRegalo() {
  return (
    <>
      <Portadilla nota="listos para dar" titulo="Packs regalo">
        Combos que ya combinan entre sí. Van en caja, envueltos y con una tarjeta escrita a mano con el mensaje que nos
        dictes.
      </Portadilla>

      <Seccion>
        <Estanteria tipo="pack" />
      </Seccion>

      <Seccion
        cielo
        nota="a tu manera"
        titulo="¿Preferís armar el tuyo?"
        bajada="Elegí lo que quieras de la papelería, sumalo a la bolsita y avisanos por WhatsApp que es para regalo: lo armamos en caja igual que los packs."
        accion={
          <Link className="boton" href="/papeleria">
            Elegir de la papelería
          </Link>
        }
      />
    </>
  );
}
