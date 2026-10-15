import type { Metadata } from "next";
import Link from "next/link";
import { Portadilla, Seccion } from "@/components/Bloques";
import { FormularioContacto } from "@/components/FormularioContacto";
import { CONTACTO, enlaceInstagram } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribinos por WhatsApp, mail o Instagram.",
};

export default function Contacto() {
  return (
    <>
      <Portadilla nota="te leemos" titulo="Contacto">
        Consultas, pedidos especiales o ganas de hablar de papel: escribinos por donde te quede más cómodo.
      </Portadilla>

      <Seccion>
        <div className="dos-columnas">
          <FormularioContacto />

          <div className="pila-papelitos">
            <div className="papelito [--fondo:var(--color-halo-suave)] [--giro:1deg]">
              <h3>Por mail</h3>
              <p>
                <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>
              </p>
            </div>
            <div className="papelito [--fondo:var(--color-lavanda-suave)] [--giro:-1deg]">
              <h3>Por Instagram</h3>
              <p>
                <a href={enlaceInstagram} target="_blank" rel="noopener">
                  @{CONTACTO.instagram}
                </a>
              </p>
            </div>
            <div className="papelito [--fondo:var(--color-menta-suave)] [--giro:0.5deg]">
              <h3>Antes de escribir</h3>
              <p>
                Puede que la respuesta ya esté en las <Link href="/preguntas-frecuentes">preguntas frecuentes</Link>.
              </p>
            </div>
          </div>
        </div>
      </Seccion>
    </>
  );
}
