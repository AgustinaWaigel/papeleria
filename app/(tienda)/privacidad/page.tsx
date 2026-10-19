import type { Metadata } from "next";
import Link from "next/link";
import { Portadilla, Seccion } from "@/components/Bloques";
import { CONTACTO } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos pedimos en Alas de Ángel Papelería, para qué los usamos y cómo pedir que los corrijamos o borremos.",
};

/* Ley 25.326 de Protección de Datos Personales. Los dos últimos párrafos son los textos que pide la normativa. */
export default function Privacidad() {
  return (
    <>
      <Portadilla nota="tus datos, cuidados" titulo="Política de privacidad">
        Pedimos lo justo para que tu compra llegue bien, y nada más. Última actualización: 19 de octubre de 2026.
      </Portadilla>

      <Seccion>
        <div className="prosa">
          <h2>Qué datos pedimos</h2>
          <p>
            Cuando comprás: nombre, mail, teléfono y, si es con envío, la dirección. Cuando te anotás en las novedades o pedís
            que te avisemos de un producto: solo el mail. Cuando dejás una reseña: el nombre que quieras poner.
          </p>

          <h2>Para qué los usamos</h2>
          <p>
            Para preparar y mandarte tu pedido, enviarte los descargables y avisarte cómo va. El mail de novedades solo te
            llega si te anotaste, y te damos de baja cuando nos lo pidas. No vendemos ni compartimos tus datos con nadie para
            publicidad.
          </p>

          <h2>Dónde se guardan</h2>
          <p>
            En los servicios que usa la tienda para funcionar: la base de datos (Supabase), el correo (Gmail) y, si pagás
            online, Mercado Pago. Los datos de tu tarjeta los maneja solo Mercado Pago: nosotras nunca los vemos. Solo las
            personas del equipo pueden ver los pedidos, con usuario y contraseña.
          </p>

          <h2>Cookies</h2>
          <p>
            La tienda no usa cookies de publicidad ni de seguimiento. Lo que llevás en la bolsita se guarda en tu propio
            navegador, para que no se pierda si cerrás la página.
          </p>

          <h2>Tus derechos</h2>
          <p>
            Podés pedirnos ver, corregir o borrar tus datos escribiendo a{" "}
            <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>. Te respondemos dentro de los plazos de la ley (10 días
            corridos para ver tus datos, 5 días hábiles para corregirlos o borrarlos). Si tenés una compra en curso, los
            guardamos hasta terminarla.
          </p>
          <p>
            El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita
            a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo
            establecido en el artículo 14, inciso 3 de la Ley N° 25.326.
          </p>
          <p>
            La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la
            atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por
            incumplimiento de las normas vigentes en materia de protección de datos personales.
          </p>
          <p>
            Ver también los <Link href="/terminos">términos y condiciones</Link>.
          </p>
        </div>
      </Seccion>
    </>
  );
}
