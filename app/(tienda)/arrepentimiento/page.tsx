import type { Metadata } from "next";
import Link from "next/link";
import { Portadilla, Seccion } from "@/components/Bloques";
import { FormArrepentimiento } from "@/components/FormArrepentimiento";

export const metadata: Metadata = {
  title: "Botón de arrepentimiento",
  description: "Cancelá tu compra dentro de los 10 días corridos. Te damos un código de trámite al instante.",
};

/* Botón de arrepentimiento: Ley 24.240 (art. 34) y Resolución 424/2020 de la Secretaría de Comercio Interior. */
export default function Arrepentimiento() {
  return (
    <>
      <Portadilla nota="sin vueltas" titulo="Botón de arrepentimiento">
        Si compraste en la tienda online y te arrepentiste, podés cancelar la compra dentro de los 10 días corridos desde
        que la recibiste (o desde que la hiciste, lo que pase último), sin dar explicaciones.
      </Portadilla>

      <Seccion>
        <div className="dos-columnas">
          <div className="prosa">
            <h2>Cómo funciona</h2>
            <p>
              Completá el formulario y te damos un <strong>código de trámite</strong> en el momento. También te lo
              mandamos por mail, así queda como comprobante.
            </p>
            <p>
              Dentro de las 24 horas te escribimos para coordinar la devolución del producto. El envío de vuelta corre por
              nuestra cuenta y, cuando lo recibimos, te devolvemos el dinero por el mismo medio con el que pagaste.
            </p>
            <h2>Qué no tiene arrepentimiento</h2>
            <p>
              Los <strong>descargables</strong> (archivos en PDF que te llegan en el momento) y los productos{" "}
              <strong>hechos a tu medida</strong>, según el artículo 1116 del Código Civil y Comercial. Si alguno llegó con
              una falla, escribinos igual y lo resolvemos.
            </p>
            <p>
              Más detalles en los <Link href="/terminos">términos y condiciones</Link>.
            </p>
          </div>
          <FormArrepentimiento />
        </div>
      </Seccion>
    </>
  );
}
