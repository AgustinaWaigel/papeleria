import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Seccion } from "@/components/Bloques";
import { Compra } from "@/components/Compra";
import { pagoOnlineActivo } from "@/lib/mercadopago";

/* Finalizar la compra online: se llega desde "Continuar compra" en la bolsita. */
export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };

export default function PaginaComprar() {
  // Con el pago online pausado, los pedidos salen por WhatsApp desde la bolsita.
  if (!pagoOnlineActivo) redirect("/");
  return (
    <Seccion nota="ya casi" titulo="Finalizar compra">
      <Compra />
    </Seccion>
  );
}
