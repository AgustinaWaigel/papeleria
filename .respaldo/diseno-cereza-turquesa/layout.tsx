import type { Metadata } from "next";
import { Anton, Karla, Syncopate } from "next/font/google";
import { ProveedorBolsita } from "@/components/Bolsita";
import { Cabecera } from "@/components/Cabecera";
import { Pie } from "@/components/Pie";
import "./globals.css";

// Las variables --web-* alimentan --fuente-titulo, --fuente-texto y --fuente-etiqueta de marca/tokens.css.
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--web-anton" });
const karla = Karla({ subsets: ["latin"], style: ["normal", "italic"], variable: "--web-karla" });
const syncopate = Syncopate({ weight: ["400", "700"], subsets: ["latin"], variable: "--web-syncopate" });

export const metadata: Metadata = {
  title: { default: "Alas de Ángel Creaciones · Papelería creativa", template: "%s · Alas de Ángel Creaciones" },
  description: "Cuadernos, agendas, stickers y plantillas para imprimir. Papelería creativa para ideas que quieren volar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${anton.variable} ${karla.variable} ${syncopate.variable}`}>
      <body>
        <a className="saltar" href="#contenido">
          Ir al contenido
        </a>
        <ProveedorBolsita>
          <Cabecera />
          <main id="contenido">{children}</main>
          <Pie />
        </ProveedorBolsita>
      </body>
    </html>
  );
}
