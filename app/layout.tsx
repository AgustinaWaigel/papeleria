import type { Metadata } from "next";
import { MARCA } from "@/lib/marca";
import { SITIO_URL } from "@/lib/sitio";
import { cssDelTema, linksDeFuentes } from "@/lib/tema";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  openGraph: { siteName: MARCA.completo, locale: "es_AR", type: "website" },
  title: {
    default: MARCA.lema ? `${MARCA.completo} · ${MARCA.lema}` : MARCA.completo,
    template: `%s · ${MARCA.completo}`,
  },
  description: MARCA.descripcion,
  // Google Search Console → "Etiqueta HTML": el código va en NEXT_PUBLIC_GOOGLE_VERIFICACION (ver .env.example).
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICACION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICACION },
  }),
};

/* La raíz pone el documento, las fuentes y el tema (colores, radios, sombras) que salen de las variables
   de entorno del rubro (ver lib/marca.ts y lib/tema.ts). La tienda y el panel tienen cada uno su layout. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior: el scroll suave (sitio.css) es para los saltos dentro de una página; al cambiar
    // de página Next lo apaga, así no se ve deslizarse hasta arriba.
    <html lang="es-AR" data-scroll-behavior="smooth" data-rubro={MARCA.rubroId}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {linksDeFuentes().map((href) => (
          // Las fuentes dependen del rubro: no se pueden fijar de antemano con next/font.
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <style id="tema" dangerouslySetInnerHTML={{ __html: cssDelTema() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
