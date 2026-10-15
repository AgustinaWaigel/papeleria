import type { Metadata } from "next";
import Link from "next/link";
import { Armador } from "@/components/Armador";
import { Portadilla, Seccion } from "@/components/Bloques";

export const metadata: Metadata = {
  title: "Personalizados",
  description: "Armá tu cuaderno o agenda con tu nombre: elegí color de tapa, dibujo e interior y mirá cómo queda.",
};

export default function Personalizados() {
  return (
    <>
      <Portadilla nota="único, como tu letra" titulo="Personalizados">
        Elegí cómo lo querés y mirá cómo va quedando. Cuando te guste, nos mandás el diseño y te pasamos precio y fecha de
        entrega.
      </Portadilla>

      <section className="seccion">
        <Armador />
      </section>

      <Seccion
        cielo
        nota="y si son muchos"
        titulo="También hacemos pedidos especiales"
        bajada="Souvenirs de cumpleaños, regalos de egresados, cuadernos con el logo de tu emprendimiento o agendas para todo un equipo. Contanos la idea y la armamos juntas."
        accion={
          <Link className="boton" href="/contacto">
            Contanos tu idea
          </Link>
        }
      />
    </>
  );
}
