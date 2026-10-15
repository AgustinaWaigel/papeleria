import type { CSSProperties } from "react";

/* El símbolo de la marca: un cuaderno abierto cuyas hojas se abren en abanico, como alas. */

const HOJA = "M0,0 C45,-20 150,-30 210,-6 C216,-40 208,-72 192,-96 C140,-104 50,-84 0,-48 Z";
const TAPA = "M0,6 C45,-12 150,-22 218,4 L218,20 C150,-4 45,6 0,26 Z";
const RENGLONES = "M6,-13 C46,-36 147,-48 204,-28 M6,-25 C47,-52 145,-67 200,-51 M6,-37 C49,-68 142,-85 195,-73";
const PLUMITA = "M0,0 C8,-16 28,-26 44,-24 C40,-8 20,4 0,0 Z";

// --a: ángulo de la hoja · --i: orden, para desfasar el aleteo
const giro = (a: number, i = 0) => ({ "--a": `${a}deg`, "--i": i }) as CSSProperties;

function Ala({ colores, espejo = false }: { colores: string[]; espejo?: boolean }) {
  return (
    <g transform={espejo ? "scale(-1 1)" : undefined}>
      {colores.map((color, n) => (
        <path key={color} className={`hoja ${color}`} style={giro(-14 * (colores.length - n), colores.length - n)} d={HOJA} />
      ))}
      <g className="hoja h-nube" style={giro(-1)}>
        <path d={HOJA} />
        <path className="renglon-hoja" d={RENGLONES} />
      </g>
      <path className="tapa" d={TAPA} />
    </g>
  );
}

export function CuadernoAlado() {
  return (
    <svg
      className="cuaderno-alado"
      viewBox="-250 -255 500 320"
      role="img"
      aria-label="Un cuaderno abierto cuyas hojas se despliegan como alas"
    >
      <Ala colores={["h-lavanda", "h-halo", "h-amanecer", "h-cielo"]} />
      <Ala colores={["h-halo", "h-lavanda", "h-cielo", "h-amanecer"]} espejo />
      <g transform="translate(150 -215)">
        <path className="plumita" style={giro(0, 0)} d={PLUMITA} />
      </g>
      <g transform="translate(-205 -150)">
        <path className="plumita" style={giro(0, 1)} d={PLUMITA} />
      </g>
      <g transform="translate(-40 -240) scale(0.7)">
        <path className="plumita" style={giro(0, 2)} d={PLUMITA} />
      </g>
    </svg>
  );
}

export function Isotipo() {
  return (
    <svg viewBox="-230 -200 460 235" aria-hidden="true">
      {[false, true].map((espejo) => (
        <g key={String(espejo)} transform={espejo ? "scale(-1 1)" : undefined}>
          <path className="hoja h-lavanda" style={giro(-44)} d={HOJA} />
          <path className="hoja h-halo" style={giro(-22)} d={HOJA} />
          <path className="hoja h-nube" style={giro(0)} d={HOJA} />
          <path className="tapa" d={TAPA} />
        </g>
      ))}
    </svg>
  );
}
