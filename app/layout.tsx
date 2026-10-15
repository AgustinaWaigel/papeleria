import type { Metadata } from "next";
import { Karla, Unbounded } from "next/font/google";
import { SITIO_URL } from "@/lib/sitio";
import "./globals.css";

// Las variables --web-* alimentan --fuente-titulo, --fuente-texto y --fuente-etiqueta de marca/tokens.css.
const unbounded = Unbounded({ subsets: ["latin"], variable: "--web-unbounded" });
const karla = Karla({ subsets: ["latin"], style: ["normal", "italic"], variable: "--web-karla" });

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  openGraph: { siteName: "Alas de Ángel Papelería", locale: "es_AR", type: "website" },
  title: { default: "Alas de Ángel Papelería · Papelería creativa", template: "%s · Alas de Ángel Papelería" },
  description: "Cuadernos, agendas, stickers y plantillas para imprimir. Papelería creativa para ideas que quieren volar.",
};

/* La raíz solo pone el documento y las fuentes. La tienda y el panel tienen cada uno su layout. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${unbounded.variable} ${karla.variable}`}>
      <body>{children}</body>
    </html>
  );
}
