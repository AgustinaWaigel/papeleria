import type { Metadata } from "next";
import { Caveat, Karla, Young_Serif } from "next/font/google";
import { ProveedorBolsita } from "@/components/Bolsita";
import { Cabecera } from "@/components/Cabecera";
import { Pie } from "@/components/Pie";
import "./globals.css";

// Las variables --web-* alimentan --fuente-titulo, --fuente-texto y --fuente-mano de marca/tokens.css.
const youngSerif = Young_Serif({ weight: "400", subsets: ["latin"], variable: "--web-young-serif" });
const karla = Karla({ subsets: ["latin"], style: ["normal", "italic"], variable: "--web-karla" });
const caveat = Caveat({ weight: ["500", "700"], subsets: ["latin"], variable: "--web-caveat" });

export const metadata: Metadata = {
  title: { default: "Alas de Ángel · Papelería creativa", template: "%s · Alas de Ángel" },
  description: "Cuadernos, agendas, stickers y plantillas para imprimir. Papelería creativa para ideas que quieren volar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${youngSerif.variable} ${karla.variable} ${caveat.variable}`}>
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
