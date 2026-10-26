import type { Metadata } from "next";
import Link from "next/link";
import { Proximamente } from "@/components/EnElTaller";
import { ABIERTAS } from "@/lib/paginas";
import { PedidoPersonalizado } from "@/components/PedidoPersonalizado";
import { Portadilla, Seccion } from "@/components/Bloques";

export const metadata: Metadata = {
  title: "Personalizados",
  description: "Cuadernos, agendas y libretas hechos a tu medida: contanos tu idea por WhatsApp y te pasamos precio y fecha.",
};

export default function Personalizados() {
  // Guardada para más adelante (ver lib/paginas.ts).
  if (!ABIERTAS.personalizados)
    return (
      <Proximamente titulo="Personalizados">
        Cuadernos y agendas hechos a tu medida, con tu nombre y tu estilo.
      </Proximamente>
    );
  return (
    <>
      <Portadilla nota="único, como tu letra" titulo="Personalizados">
        Contanos cómo te lo imaginás y nos llega por WhatsApp. Lo charlamos juntas y te pasamos precio y fecha de entrega.
      </Portadilla>

      <section className="seccion">
        <PedidoPersonalizado />
      </section>

      <Seccion
        cielo
        nota="y si son muchos"
        titulo="También hacemos pedidos especiales"
        bajada="Souvenirs de cumpleaños, regalos de egresados, cuadernos con el logo de tu emprendimiento o agendas para todo un equipo. Contanos la idea y la armamos juntas."
        accion={
          <Link className="boton" href="/pedidos-por-mayor">
            Pedir presupuesto
          </Link>
        }
      />
    </>
  );
}
