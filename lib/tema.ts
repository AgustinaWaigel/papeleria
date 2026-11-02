/* Convierte la marca (lib/marca.ts) en CSS: pisa las variables de marca/tokens.css y arma los links de
   Google Fonts. Lo usa app/layout.tsx en el <head> de todas las páginas. */

import { COLORES, ESTILO, FUENTES } from "./marca";

// Solo valores de CSS seguros: nada de llaves, punto y coma ni etiquetas que corten el <style>.
const limpio = (valor: string) => valor.replace(/[{};<>]/g, "").trim();

const pila = (familia: string, respaldo: string) => `"${limpio(familia).replace(/"/g, "")}", ${respaldo}`;

// Tamaños originales de marca/tokens.css: TEXTO_ESCALA los multiplica.
const TAMANOS: [variable: string, valor: string][] = [
  ["texto-xs", "0.8125rem"],
  ["texto-s", "0.9375rem"],
  ["texto-m", "1.0625rem"],
  ["texto-l", "1.25rem"],
  ["texto-xl", "1.375rem"],
  ["texto-2xl", "clamp(1.75rem, 3.5vw, 2.5rem)"],
  ["texto-3xl", "clamp(2.25rem, 6vw, 4.25rem)"],
  ["texto-etiqueta", "0.8125rem"],
];

function sombras() {
  const d = limpio(ESTILO.desplazamiento);
  if (ESTILO.sombra === "ninguna")
    return { sello: "none", alta: "none", chica: "none", principal: "none", principalAlta: "none" };
  if (ESTILO.sombra === "suave") {
    const suave = (tam: number) =>
      `0 ${tam / 4}px ${tam / 2}px color-mix(in srgb, var(--color-tinta) 10%, transparent), 0 ${tam}px ${tam * 2.5}px -${tam / 2}px color-mix(in srgb, var(--color-tinta) 22%, transparent)`;
    return { sello: suave(8), alta: suave(14), chica: suave(4), principal: suave(8), principalAlta: suave(14) };
  }
  // "sello": sólida y corrida, como un sello de goma.
  const alta = `calc(${d} * 1.75)`;
  const chica = `calc(${d} / 2)`;
  return {
    sello: `${d} ${d} 0 var(--color-tinta)`,
    alta: `${alta} ${alta} 0 var(--color-tinta)`,
    chica: `${chica} ${chica} 0 var(--color-tinta)`,
    principal: `${d} ${d} 0 var(--color-amanecer-fuerte)`,
    principalAlta: `${alta} ${alta} 0 var(--color-amanecer-fuerte)`,
  };
}

export function cssDelTema() {
  const s = sombras();
  const escala = FUENTES.escala;
  const variables = [
    ...Object.entries(COLORES).map(([nombre, valor]) => `--color-${nombre}: ${limpio(valor)};`),
    "--color-velo: color-mix(in srgb, var(--color-tinta) 50%, transparent);",

    `--fuente-titulo: ${pila(FUENTES.titulos, "system-ui, sans-serif")};`,
    `--fuente-texto: ${pila(FUENTES.texto, "system-ui, sans-serif")};`,
    `--fuente-etiqueta: ${pila(FUENTES.etiquetas, "system-ui, sans-serif")};`,
    `--fuente-mano: ${FUENTES.mano ? pila(FUENTES.mano, "cursive") : "var(--fuente-etiqueta)"};`,
    `--titulos-mayusculas: ${FUENTES.mayusculas ? "uppercase" : "none"};`,
    ...(escala === 1 ? [] : TAMANOS.map(([v, valor]) => `--${v}: calc(${valor} * ${escala});`)),

    `--radio-s: ${limpio(ESTILO.radioChico)};`,
    `--radio-m: ${limpio(ESTILO.radio)};`,
    `--radio-l: ${limpio(ESTILO.radioGrande)};`,
    `--radio-pastilla: ${limpio(ESTILO.radioPastilla)};`,
    `--linea: ${limpio(ESTILO.linea)};`,
    `--ancho-max: ${limpio(ESTILO.ancho)};`,

    `--sombra-sello: ${s.sello};`,
    `--sombra-sello-alta: ${s.alta};`,
    `--sombra-sello-chica: ${s.chica};`,
    `--sombra-sello-principal: ${s.principal};`,
    `--sombra-sello-principal-alta: ${s.principalAlta};`,
  ];

  // html:root le gana a :root de marca/tokens.css sin depender del orden en que se cargan.
  const reglas = [`html:root{${variables.join("")}}`];
  // Sin mayúsculas, el espaciado entre letras pensado para versales sobra.
  if (!FUENTES.mayusculas) reglas.push("h1,h2,.logo,.pie__lema{letter-spacing:0}");
  // Sin la fuente a mano, las notas se leen como una etiqueta en cursiva suave.
  if (!FUENTES.mano) reglas.push(".nota-mano{font-style:italic;font-weight:600;letter-spacing:0.02em}");
  if (!ESTILO.patron) reglas.push(".portada::before,.portadilla::before{display:none}");
  return reglas.join("\n");
}

/* Un link de Google Fonts por familia y grosor: si una fuente no tiene ese grosor, falla solo ese link
   y el resto carga igual (un link con todo junto fallaría entero). */
export function linksDeFuentes() {
  const pedidos = new Map<string, Set<string>>();
  const pedir = (familia: string, grosores: string[]) => {
    if (!familia) return;
    const nombre = limpio(familia);
    const set = pedidos.get(nombre) ?? new Set<string>();
    grosores.forEach((g) => set.add(g));
    pedidos.set(nombre, set);
  };
  pedir(FUENTES.titulos, ["400", "700", "800"]);
  pedir(FUENTES.texto, ["400", "700", "ital400"]);
  pedir(FUENTES.etiquetas, ["400", "700"]);
  pedir(FUENTES.mano, ["400"]);

  const links: string[] = [];
  for (const [familia, grosores] of pedidos) {
    const f = encodeURIComponent(familia).replace(/%20/g, "+");
    for (const g of grosores) {
      const eje = g.startsWith("ital") ? `:ital,wght@1,${g.slice(4)}` : g === "400" ? "" : `:wght@${g}`;
      links.push(`https://fonts.googleapis.com/css2?family=${f}${eje}&display=swap`);
    }
  }
  return links;
}
