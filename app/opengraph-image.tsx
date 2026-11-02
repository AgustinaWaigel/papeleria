import { ImageResponse } from "next/og";
import { ALA_LOGO, HALO_LOGO } from "@/lib/alas";
import { COLORES, MARCA, PORTADA } from "@/lib/marca";

/* La imagen que acompaña los links del sitio en WhatsApp, Instagram o Facebook.
   Los productos con foto usan su primera foto (ver producto/[id]/page.tsx).
   Colores y textos salen del rubro (lib/marca.ts): acá no llegan las variables CSS. */
export const alt = MARCA.lema ? `${MARCA.completo} · ${MARCA.lema}` : MARCA.completo;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TINTA = COLORES.tinta;
const FONDO = COLORES.lavanda;
const ACENTO = COLORES.halo;
const PRINCIPAL = COLORES.amanecer;

function Logo() {
  if (MARCA.logo === "alas")
    return (
      <svg width="88" height="88" viewBox="-500 -500 1000 1000">
        <rect x="-500" y="-500" width="1000" height="1000" rx="200" fill={PRINCIPAL} />
        <path fill="#fff" fillRule="evenodd" d={ALA_LOGO} />
        <ellipse fill="#fff" cx={HALO_LOGO.cx} cy={HALO_LOGO.cy} rx={HALO_LOGO.rx} ry={HALO_LOGO.ry} />
      </svg>
    );
  return (
    <div style={{ width: 88, height: 88, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 18, background: PRINCIPAL, color: COLORES.nube, fontSize: 56, fontWeight: 800 }}>
      {MARCA.inicial}
    </div>
  );
}

export default function Imagen() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: FONDO, color: TINTA, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 30, fontWeight: 700, letterSpacing: 6, textTransform: "uppercase", color: PRINCIPAL }}>
          <Logo />
          {MARCA.rubro ? `${MARCA.nombre} · ${MARCA.rubro}` : MARCA.nombre}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", fontSize: 92, fontWeight: 800, lineHeight: 1.05, marginTop: 28, maxWidth: 1040 }}>
          {PORTADA.titulo}
          {PORTADA.resalte && <span style={{ background: ACENTO, padding: "0 16px", marginLeft: 22 }}>{PORTADA.resalte}</span>}
        </div>
        {MARCA.descripcion && <div style={{ fontSize: 34, marginTop: 36, maxWidth: 1040 }}>{MARCA.descripcion}</div>}
      </div>
    ),
    size,
  );
}
