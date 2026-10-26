/* Listas escolares: de la lista de útiles que pega una familia o una docente, qué productos de la tienda
   corresponden a cada renglón y cuántos. Todo en el navegador, sin la base. */

import { normalizar } from "./productos";

export type ProductoLista = { id: string; nombre: string; texto: string };
export type RenglonLista = { original: string; cantidad: number; opciones: string[] };

// Palabras que no ayudan a encontrar el producto.
const VACIAS = new Set(
  "de del la el los las un una unos unas con sin para por y o a al en tipo marca color colores n nro numero x u uni unidad unidades c cm mm hoja".split(" "),
);

/* La raíz de una palabra, para que "cuadernos" encuentre "cuaderno" y "lápices" encuentre "lápiz". */
const raiz = (palabra: string) => {
  const p = palabra.replace(/z/g, "c");
  return p.length > 5 ? p.slice(0, -2) : p.replace(/s$/, "");
};

const palabras = (texto: string) =>
  normalizar(texto)
    .split(/[^a-z0-9ñ]+/)
    .filter((p) => p.length > 1 && !VACIAS.has(p) && !/^\d+$/.test(p));

/* Un renglón de la lista: sin viñetas ni numeración, con la cantidad aparte.
   "• 2 cuadernos tapa dura" → 2 · "cuadernos tapa dura"; "Lápices de colores x 12" → 1 · "Lápices de colores x 12"
   (12 son los lápices de la caja, no 12 cajas); "Cuaderno (3)" → 3. */
export function leerRenglon(linea: string): { cantidad: number; texto: string } | null {
  let texto = linea.replace(/^[\s•·*\-–—>]+/, "").replace(/^\d{1,2}[.)]\s+/, "").trim();
  if (!texto) return null;
  let cantidad = 1;
  const adelante = texto.match(/^(\d{1,3})\s*(?:u\.?|unidades?|x)?\s+(.+)$/i);
  const entreParentesis = texto.match(/^(.+?)\s*\((\d{1,3})\)\s*$/);
  if (adelante) {
    cantidad = Number(adelante[1]);
    texto = adelante[2];
  } else if (entreParentesis) {
    cantidad = Number(entreParentesis[2]);
    texto = entreParentesis[1];
  }
  return { cantidad: Math.min(Math.max(cantidad, 1), 99), texto: texto.trim() };
}

/* Los productos que mejor coinciden con un texto, de más a menos parecido (como mucho tres). */
export function buscarParecidos(texto: string, productos: ProductoLista[]) {
  const buscadas = palabras(texto).map(raiz);
  if (buscadas.length === 0) return [];
  return productos
    .map((p) => {
      const enNombre = palabras(p.nombre).map(raiz);
      const enTodo = palabras(p.texto).map(raiz);
      const tiene = (lista: string[], w: string) => lista.some((x) => x.startsWith(w) || w.startsWith(x));
      // El nombre pesa el doble que la descripción y las etiquetas.
      const puntos = buscadas.reduce((s, w) => s + (tiene(enNombre, w) ? 2 : tiene(enTodo, w) ? 1 : 0), 0);
      return { id: p.id, puntos: puntos / (buscadas.length * 2) };
    })
    .filter((r) => r.puntos >= 0.3)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 3)
    .map((r) => r.id);
}

/* La lista entera: un renglón por línea con texto. */
export function leerLista(lista: string, productos: ProductoLista[]): RenglonLista[] {
  return lista.split(/\r?\n/).flatMap((linea) => {
    const r = leerRenglon(linea);
    return r ? [{ original: r.texto, cantidad: r.cantidad, opciones: buscarParecidos(r.texto, productos) }] : [];
  });
}
