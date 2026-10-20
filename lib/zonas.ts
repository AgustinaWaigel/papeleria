/* Zonas de envío por código postal. Corre en el navegador (para mostrar el costo en la bolsita) y en el
   servidor; la cuenta que vale es la de la base (crear_pedido_online en supabase/07-envios-cupones-y-mas.sql),
   que sigue la misma regla:
   1. una zona que nombre el código postal (por ejemplo, Paraná: 3100);
   2. si no, la primera zona que incluya la provincia;
   3. el costo es el de la zona o, si no tiene, el costo por defecto; sin ninguno, se coordina aparte. */

/* Las provincias con la letra con la que empieza su código postal nuevo (CPA): E3100ABC es Entre Ríos. */
export const PROVINCIAS: [letra: string, nombre: string][] = [
  ["C", "Ciudad de Buenos Aires"],
  ["B", "Buenos Aires"],
  ["K", "Catamarca"],
  ["H", "Chaco"],
  ["U", "Chubut"],
  ["X", "Córdoba"],
  ["W", "Corrientes"],
  ["E", "Entre Ríos"],
  ["P", "Formosa"],
  ["Y", "Jujuy"],
  ["L", "La Pampa"],
  ["F", "La Rioja"],
  ["M", "Mendoza"],
  ["N", "Misiones"],
  ["Q", "Neuquén"],
  ["R", "Río Negro"],
  ["A", "Salta"],
  ["J", "San Juan"],
  ["D", "San Luis"],
  ["Z", "Santa Cruz"],
  ["S", "Santa Fe"],
  ["G", "Santiago del Estero"],
  ["V", "Tierra del Fuego"],
  ["T", "Tucumán"],
];

export const nombreProvincia = (letra: string | null) => PROVINCIAS.find(([l]) => l === letra)?.[1] ?? null;

/* Los 4 números del código postal, venga como "3100", "E3100" o "E3100ABC". */
export function numeroCP(cp: string) {
  const numeros = cp.toUpperCase().replace(/^[A-Z]/, "").match(/\d{4}/);
  return numeros ? numeros[0] : null;
}

// Para el código postal viejo (solo números) la provincia sale de rangos aproximados: algunos se pisan en los
// límites entre provincias, por eso es solo una sugerencia y quien compra la puede corregir.
const RANGOS: [desde: number, hasta: number, letra: string][] = [
  [1000, 1499, "C"],
  [1500, 1999, "B"],
  [2000, 2699, "S"],
  [2700, 2799, "B"],
  [2800, 2819, "B"],
  [2820, 2899, "E"],
  [2900, 2999, "B"],
  [3000, 3099, "S"],
  [3100, 3299, "E"],
  [3300, 3399, "N"],
  [3400, 3499, "W"],
  [3500, 3559, "H"],
  [3560, 3599, "S"],
  [3600, 3699, "P"],
  [3700, 3799, "H"],
  [4000, 4199, "T"],
  [4200, 4399, "G"],
  [4400, 4599, "A"],
  [4600, 4699, "Y"],
  [4700, 4799, "K"],
  [5000, 5299, "X"],
  [5300, 5399, "F"],
  [5400, 5499, "J"],
  [5500, 5699, "M"],
  [5700, 5799, "D"],
  [5800, 5999, "X"],
  [6000, 6299, "B"],
  [6300, 6399, "L"],
  [6400, 7999, "B"],
  [8000, 8199, "B"],
  [8300, 8399, "Q"],
  [8400, 8599, "R"],
  [9000, 9299, "U"],
  [9300, 9409, "Z"],
  [9410, 9499, "V"],
];

/* La provincia que corresponde a un código postal, si se puede saber. */
export function provinciaDeCP(cp: string) {
  const limpio = cp.trim().toUpperCase();
  const letra = limpio.match(/^([A-Z])\d{4}/)?.[1];
  if (letra && PROVINCIAS.some(([l]) => l === letra)) return letra;
  const numero = numeroCP(limpio);
  if (!numero || /^[A-Z]/.test(limpio)) return null;
  const n = Number(numero);
  return RANGOS.find(([desde, hasta]) => n >= desde && n <= hasta)?.[2] ?? null;
}

export type Zona = { id: number; nombre: string; provincias: string[]; codigos_postales: string[]; costo: number | null; orden: number };

/* Una zona que nombra este código postal y tiene precio (por ejemplo, Crespo): ese precio es fijo y
   gana también sobre la cotización de Correo Argentino (son envíos que no van por correo). */
export function zonaLocal(zonas: Zona[], cp: string) {
  const numero = numeroCP(cp);
  if (!numero) return null;
  return [...zonas].sort((a, b) => a.orden - b.orden).find((z) => z.codigos_postales.includes(numero) && z.costo !== null) ?? null;
}

export function zonaPara(zonas: Zona[], provincia: string | null, cp: string) {
  const numero = numeroCP(cp);
  const ordenadas = [...zonas].sort((a, b) => a.orden - b.orden);
  return (
    (numero && ordenadas.find((z) => z.codigos_postales.includes(numero))) ||
    (provincia && ordenadas.find((z) => z.provincias.includes(provincia))) ||
    null
  );
}
