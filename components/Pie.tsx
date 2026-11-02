import Link from "next/link";
import { CONTACTO, enlaceInstagram, enlaceWhatsApp } from "@/lib/contacto";
import { PAGINAS, PAGINAS_LEGALES, PAGINAS_PIE } from "@/lib/paginas";
import { FormSuscripcion } from "./FormSuscripcion";
import { MARCA } from "@/lib/marca";

export function Pie({ regalo }: { regalo?: string | null }) {
  return (
    <footer className="pie">
      <div className="contenedor">
        <FormSuscripcion regalo={regalo} />
        <div className="pie__grilla">
          <p className="pie__lema">{MARCA.lema || MARCA.nombre}</p>
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
            <h2>{MARCA.completo}</h2>
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
                <a href={enlaceWhatsApp(`¡Hola ${MARCA.nombre}!`)} target="_blank" rel="noopener">
                  WhatsApp
                </a>
              </li>
              {CONTACTO.instagram && (
                <li>
                  <a href={enlaceInstagram} target="_blank" rel="noopener">
                    Instagram
                  </a>
                </li>
              )}
              {CONTACTO.email && (
                <li>
                  <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>
                </li>
              )}
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
          <p>
            © {MARCA.completo}
            {MARCA.lema && ` · ${MARCA.lema}`}
          </p>
        </div>
      </div>
    </footer>
  );
}
