import type { Metadata } from "next";
import Link from "next/link";
import { Proximamente } from "@/components/EnElTaller";
import { ABIERTAS } from "@/lib/paginas";
import { Portadilla, Seccion } from "@/components/Bloques";
import { Estanteria } from "@/components/Estanteria";
import { CATALOGO } from "@/lib/marca";

export const metadata: Metadata = {
  title: "Packs regalo",
  description: "Combos ya armados y envueltos, listos para regalar.",
};

export default function PacksRegalo() {
  // Guardada para más adelante (ver lib/paginas.ts).
  if (!ABIERTAS.packs)
    return (
      <Proximamente titulo="Packs regalo">
        Combos ya armados y envueltos, listos para regalar.
      </Proximamente>
    );
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
        bajada="Elegí lo que quieras del catálogo, sumalo a la bolsita y avisanos por WhatsApp que es para regalo: lo armamos en caja igual que los packs."
        accion={
          <Link className="boton" href={CATALOGO.ruta}>
            {CATALOGO.boton}
          </Link>
        }
      />
    </>
  );
}
