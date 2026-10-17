import type { Metadata } from "next";
import { Baloo_2, Karla, La_Belle_Aurore, Londrina_Solid } from "next/font/google";
import { SITIO_URL } from "@/lib/sitio";
import "./globals.css";

// Las variables --web-* alimentan --fuente-titulo, --fuente-texto, --fuente-etiqueta y --fuente-mano de marca/tokens.css.
const baloo = Baloo_2({ subsets: ["latin"], variable: "--web-baloo" });
// Londrina Solid se carga solo en 400: ya es gruesa, y así todos los títulos salen con el mismo trazo.
const londrina = Londrina_Solid({ weight: "400", subsets: ["latin"], variable: "--web-londrina" });
const aurore = La_Belle_Aurore({ weight: "400", subsets: ["latin"], variable: "--web-aurore" });
const karla = Karla({ subsets: ["latin"], style: ["normal", "italic"], variable: "--web-karla" });

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  openGraph: { siteName: "Alas de Ángel Papelería", locale: "es_AR", type: "website" },
  title: { default: "Alas de Ángel Papelería · Papelería creativa", template: "%s · Alas de Ángel Papelería" },
  description: "Cuadernos, agendas, stickers y plantillas para imprimir. Papelería hecha a mano para escribir, soñar y volar.",
};

/* La raíz solo pone el documento y las fuentes. La tienda y el panel tienen cada uno su layout. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${londrina.variable} ${baloo.variable} ${aurore.variable} ${karla.variable}`}>
      <body>{children}</body>
    </html>
  );
}
