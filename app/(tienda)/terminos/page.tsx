import type { Metadata } from "next";
import Link from "next/link";
import { Portadilla, Seccion } from "@/components/Bloques";
import { CONTACTO, enlaceWhatsApp } from "@/lib/contacto";
import { pagoOnlineActivo } from "@/lib/mercadopago";
import { SOLO_CRESPO } from "@/lib/zonas";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Cómo comprar en Alas de Ángel Papelería: precios, pagos, envíos, descargables, cambios y arrepentimiento.",
};

/* Texto base, pensado para un emprendimiento chico en Argentina. Conviene que lo lea alguien de confianza
   (contador/a o abogado/a) y sumar los datos fiscales donde dice "Quiénes somos". */
export default function Terminos() {
  return (
    <>
      <Portadilla nota="la letra chica, pero grande" titulo="Términos y condiciones">
        Lo que tenés que saber para comprar tranquila. Última actualización: 19 de octubre de 2026.
      </Portadilla>

      <Seccion>
        <div className="prosa">
          <h2>Quiénes somos</h2>
          <p>
            Alas de Ángel Papelería es un emprendimiento de papelería creativa de Argentina. Nos podés escribir a{" "}
            <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a> o por{" "}
            <a href={enlaceWhatsApp("¡Hola Alas de Ángel!")} target="_blank" rel="noopener">
              WhatsApp
            </a>
            . Al comprar en la tienda aceptás estos términos.
          </p>

          <h2>Precios y stock</h2>
          <p>
            Los precios están en pesos argentinos y son finales. Pueden cambiar sin aviso, pero se respeta el precio que
            figuraba al momento de tu compra. Si un producto se agota mientras comprás, te avisamos antes de cobrar.
          </p>

          <h2>Cómo se paga</h2>
          {pagoOnlineActivo ? (
            <p>
              Online con Mercado Pago (tarjeta de crédito, débito o dinero en cuenta), o por WhatsApp coordinando
              transferencia o efectivo. Los pagos con Mercado Pago los procesa Mercado Pago: nosotras nunca vemos ni guardamos
              los datos de tu tarjeta.
            </p>
          ) : (
            <p>
              Por ahora los pedidos se hacen por WhatsApp: desde la bolsita nos mandás tu pedido y coordinamos el pago por
              transferencia o en efectivo.
            </p>
          )}

          <h2>Envíos y retiro</h2>
          {SOLO_CRESPO ? (
            <p>
              Podés retirar tu pedido (coordinamos por WhatsApp dónde y cuándo) o, si sos de Crespo, recibirlo en tu casa.
              Por ahora los envíos son solo dentro de Crespo: el pedido con envío se manda por WhatsApp y ahí coordinamos el
              costo, el pago y el día de entrega.
            </p>
          ) : (
            <p>
              Podés retirar tu pedido (coordinamos por WhatsApp dónde y cuándo) o recibirlo en tu casa. El costo del envío se
              muestra antes de pagar; si dice “a coordinar”, te lo pasamos por WhatsApp y se paga aparte. Cuando el pedido sale,
              te avisamos por mail con el número de seguimiento. Los plazos de entrega dependen del correo.
            </p>
          )}

          <h2>Descargables</h2>
          <p>
            Los descargables son archivos PDF que te llegan por mail apenas se acredita el pago. Son para uso personal: podés
            imprimirlos todas las veces que quieras, pero no revenderlos, compartirlos ni publicarlos. Por ser archivos que se
            entregan al instante, no tienen arrepentimiento ni cambio (artículo 1116 del Código Civil y Comercial), salvo que
            tengan una falla nuestra.
          </p>

          <h2>Cambios y garantía</h2>
          <p>
            Los productos físicos sin uso y en su envoltorio se pueden cambiar dentro de los 10 días de recibidos. Si algo
            llegó fallado o roto, escribinos con una foto y lo resolvemos: lo cambiamos o te devolvemos el dinero. Además,
            rige la garantía legal de la Ley de Defensa del Consumidor (Ley 24.240).
          </p>

          <h2>Arrepentimiento</h2>
          <p>
            Tenés 10 días corridos desde que recibís el producto (o desde la compra, lo que pase último) para arrepentirte, sin
            dar explicaciones. Lo pedís desde el <Link href="/arrepentimiento">botón de arrepentimiento</Link>: te damos un
            código de trámite al instante, el envío de vuelta corre por nuestra cuenta y te devolvemos el dinero por el mismo
            medio de pago.
          </p>

          <h2>Cupones</h2>
          <p>
            Los cupones de descuento valen lo que dice cada uno (porcentaje o monto, compra mínima, vencimiento, cantidad de
            usos). Se usa uno por compra y no se cambian por dinero.
          </p>

          <h2>Diseños</h2>
          <p>
            Los diseños, ilustraciones, textos y fotos de la tienda son de Alas de Ángel. No se pueden copiar ni usar con fines
            comerciales sin permiso.
          </p>

          <h2>Tus datos</h2>
          <p>
            Usamos tus datos solo para tu compra. Más detalles en la <Link href="/privacidad">política de privacidad</Link>.
          </p>

          <h2>Si algo sale mal</h2>
          <p>
            Escribinos primero: casi todo se resuelve en una charla. Igual, siempre podés hacer un reclamo ante{" "}
            <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener">
              Defensa del Consumidor
            </a>
            . Estos términos se rigen por las leyes de la República Argentina.
          </p>
        </div>
      </Seccion>
    </>
  );
}
