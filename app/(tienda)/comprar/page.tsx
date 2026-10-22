import type { Metadata } from "next";
import { Seccion } from "@/components/Bloques";
import { Compra } from "@/components/Compra";

/* Finalizar la compra: se llega desde "Continuar compra" en la bolsita. Termina pagando con Mercado Pago o,
   con el pago online pausado (lib/mercadopago.ts), mandando el pedido por WhatsApp. */
export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };

export default function PaginaComprar() {
  return (
    <Seccion nota="ya casi" titulo="Finalizar compra">
      <Compra />
    </Seccion>
  );
}
