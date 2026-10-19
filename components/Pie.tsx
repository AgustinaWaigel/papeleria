import Link from "next/link";
import { CONTACTO, enlaceInstagram, enlaceWhatsApp } from "@/lib/contacto";
import { PAGINAS, PAGINAS_LEGALES, PAGINAS_PIE } from "@/lib/paginas";
import { FormSuscripcion } from "./FormSuscripcion";

export function Pie() {
  return (
    <footer className="pie">
      <div className="contenedor">
        <FormSuscripcion />
        <div className="pie__grilla">
          <p className="pie__lema">Para escribir, soñar y volar.</p>
          <div>
            <h2>Tienda</h2>
            <ul>
              {PAGINAS.slice(0, 4).map(([href, nombre]) => (
                <li key={href}>
                  <Link href={href}>{nombre}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Alas de Ángel Papelería</h2>
            <ul>
              {PAGINAS_PIE.map(([href, nombre]) => (
                <li key={href}>
                  <Link href={href}>{nombre}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Escribinos</h2>
            <ul>
              <li>
                <a href={enlaceWhatsApp("¡Hola Alas de Ángel!")} target="_blank" rel="noopener">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={enlaceInstagram} target="_blank" rel="noopener">
                  Instagram
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pie__legal">
          <ul>
            {PAGINAS_LEGALES.map(([href, nombre]) => (
              <li key={href}>
                <Link href={href} className={href === "/arrepentimiento" ? "pie__arrepentimiento" : undefined}>
                  {nombre}
                </Link>
              </li>
            ))}
          </ul>
          <p>© Alas de Ángel Papelería · Para escribir, soñar y volar.</p>
        </div>
      </div>
    </footer>
  );
}
