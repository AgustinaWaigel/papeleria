import { ImageResponse } from "next/og";
import { ALA_LOGO, HALO_LOGO } from "@/lib/alas";

/* La imagen que acompaña los links del sitio en WhatsApp, Instagram o Facebook.
   Los productos con foto usan su primera foto (ver producto/[id]/page.tsx). */
export const alt = "Alas de Ángel Papelería · Papel para ideas que quieren volar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colores de marca/tokens.css (acá no llegan las variables CSS).
const TINTA = "#0B5E41";
const LAVANDA = "#F4A9CB";
const HALO = "#B9D53B";
const AMANECER = "#7F2350";

export default function Imagen() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: LAVANDA, color: TINTA, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 30, fontWeight: 700, letterSpacing: 6, textTransform: "uppercase", color: AMANECER }}>
          <svg width="88" height="88" viewBox="-500 -500 1000 1000">
            <rect x="-500" y="-500" width="1000" height="1000" rx="200" fill={AMANECER} />
            <path fill="#fff" fillRule="evenodd" d={ALA_LOGO} />
            <ellipse fill="#fff" cx={HALO_LOGO.cx} cy={HALO_LOGO.cy} rx={HALO_LOGO.rx} ry={HALO_LOGO.ry} />
          </svg>
          Alas de Ángel · Papelería
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", fontSize: 92, fontWeight: 800, lineHeight: 1.05, marginTop: 28, maxWidth: 980 }}>
          Papel para ideas que quieren&nbsp;<span style={{ background: HALO, padding: "0 16px" }}>volar.</span>
        </div>
        <div style={{ fontSize: 34, marginTop: 36 }}>Cuadernos, agendas, stickers y plantillas para imprimir.</div>
      </div>
    ),
    size,
  );
}
