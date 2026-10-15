import type { CSSProperties } from "react";
import { ALA_BANNER, ALA_LOGO, HALO_BANNER, HALO_LOGO } from "@/lib/alas";

/* El símbolo de la marca: las alas con el halo. Los trazos están en lib/alas.ts.
   Las animaciones (en app/sitio.css) se apagan solas con prefers-reduced-motion. */

// Donde el ala se une al cuerpo: es el eje sobre el que aletea.
const RAIZ = { x: -60, y: 40 };

// Destellos alrededor de las alas: posición, tamaño y orden (para desfasar el titileo).
const BRILLOS: [x: number, y: number, tam: number][] = [
  [-170, -245, 1],
  [175, -255, 0.8],
  [-445, -70, 0.7],
  [450, -40, 0.9],
  [0, 150, 0.6],
  [-300, 225, 0.5],
  [310, 215, 0.7],
];
const DESTELLO = "M0,-18 C2,-4 4,-2 18,0 C4,2 2,4 0,18 C-2,4 -4,2 -18,0 C-4,-2 -2,-4 0,-18 Z";

const orden = (i: number) => ({ "--i": i }) as CSSProperties;

/* Cada ala va anidada: el grupo de afuera la lleva al eje, el del medio se despliega al entrar
   y el de adentro aletea. Así las dos animaciones no se pisan. */
function Ala({ espejo = false }: { espejo?: boolean }) {
  return (
    <g transform={espejo ? "scale(-1 1)" : undefined}>
      <g transform={`translate(${RAIZ.x} ${RAIZ.y})`}>
        <g className="alas__despliegue" style={orden(espejo ? 1 : 0)}>
          <g className="alas__aleteo">
            <path fillRule="evenodd" transform={`translate(${-RAIZ.x} ${-RAIZ.y})`} d={ALA_BANNER} />
          </g>
        </g>
      </g>
    </g>
  );
}

export function AlasAnimadas() {
  return (
    <div className="alas">
      <svg className="alas__dibujo" viewBox="-510 -310 1020 580" role="img" aria-label="Dos alas blancas con un halo, aleteando">
        {BRILLOS.map(([x, y, tam], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${tam})`}>
            <path className="alas__brillo" style={orden(i)} d={DESTELLO} />
          </g>
        ))}
        <Ala />
        <Ala espejo />
        <g className="alas__halo-entrada">
          <ellipse className="alas__halo" {...HALO_BANNER} />
        </g>
      </svg>
    </div>
  );
}

/* El logo: un ala sola sobre el cuadrado vino. */
export function Isotipo() {
  return (
    <svg className="isotipo" viewBox="-500 -500 1000 1000" aria-hidden="true">
      <rect x="-500" y="-500" width="1000" height="1000" rx="200" />
      <path className="isotipo__ala" fillRule="evenodd" d={ALA_LOGO} />
      <ellipse className="isotipo__halo" {...HALO_LOGO} />
    </svg>
  );
}
