import { ImageResponse } from "next/og";
import { ALA_LOGO, HALO_LOGO } from "@/lib/alas";
import { COLORES, MARCA } from "@/lib/marca";

/* El ícono de la pestaña, según MARCA_LOGO: las alas, la inicial o (con una imagen propia) la inicial igual;
   para usar tu imagen como ícono, poné un app/icon.png y borrá este archivo. */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icono() {
  return new ImageResponse(
    MARCA.logo === "alas" ? (
      <svg width="64" height="64" viewBox="-500 -500 1000 1000">
        <rect x="-500" y="-500" width="1000" height="1000" rx="200" fill={COLORES.amanecer} />
        <path fill="#fff" fillRule="evenodd" d={ALA_LOGO} />
        <ellipse fill="#fff" cx={HALO_LOGO.cx} cy={HALO_LOGO.cy} rx={HALO_LOGO.rx} ry={HALO_LOGO.ry} />
      </svg>
    ) : (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 13, background: COLORES.amanecer, color: COLORES.nube, fontSize: 42, fontWeight: 800 }}>
        {MARCA.inicial}
      </div>
    ),
    size,
  );
}
