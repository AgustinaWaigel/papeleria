/* Alas de Ángel Papelería — tipos y datos fijos del catálogo.
   Los productos se cargan y editan desde el panel (/admin), uno por uno o con un Excel.

   Cada producto:
     id        único, sin espacios
     tipo      "fisico" | "descargable" | "pack"
     cat       una de las categorías de CATEGORIAS (los packs no llevan)
     nombre, desc, detalle
     precio    en pesos, sin puntos
     dibujo    nombre de un dibujo de DIBUJOS
     color     "lavanda" | "amanecer" | "halo" | "menta"
     destacado true para que aparezca en Inicio
     contenido (solo packs) lista de lo que trae

   Cada producto tiene su página en /producto/<id>. Para completarla (todo opcional):
     fotos            rutas dentro de public/ o direcciones completas (las fotos que se suben
                      desde el panel quedan en Supabase Storage). La primera es también la de la
                      ficha del catálogo. Sin fotos se muestra el dibujo.
     descripcion      párrafos de texto largo, uno por elemento de la lista
     caracteristicas  lista de datos; si falta, se arma sola a partir de detalle
     etiquetas        palabras sueltas ("Escuela", "Vuelta al cole"). Las que coinciden con una sección
                      (tabla secciones) llevan el producto a esa sección del menú.
*/

import type { CSSProperties } from "react";

export type TipoProducto = "fisico" | "descargable" | "pack";
export type ColorProducto = "lavanda" | "amanecer" | "halo" | "menta";
export type NombreDibujo = keyof typeof DIBUJOS;

export type Producto = {
  id: string;
  tipo: TipoProducto;
  cat?: string;
  nombre: string;
  desc: string;
  detalle?: string;
  precio: number;
  dibujo: NombreDibujo;
  color: ColorProducto;
  destacado?: boolean;
  contenido?: string[];
  fotos?: string[];
  descripcion?: string[];
  caracteristicas?: string[];
  stock?: number; // sin valor: no se controla
  precioAnterior?: number; // si es mayor que precio, está en oferta
  etiquetas?: string[];
  porCantidad?: Escala[]; // descuentos llevando varias unidades (supabase/10-precio-por-cantidad.sql)
};

/* Llevando `cantidad` o más unidades, cada una sale `descuento` % menos. */
export type Escala = { cantidad: number; descuento: number };

/* La escala que corresponde a esa cantidad (la de mayor descuento alcanzado), o ninguna. */
export const escalaPara = (escalas: Escala[] | undefined, cantidad: number) =>
  (escalas ?? []).filter((e) => e.cantidad <= cantidad).sort((a, b) => b.descuento - a.descuento)[0];

/* El precio de una unidad llevando `cantidad`. El mismo cálculo que precio_por_cantidad() en la base. */
export function precioUnitario(p: { precio: number; porCantidad?: Escala[] }, cantidad: number) {
  const escala = escalaPara(p.porCantidad, cantidad);
  return escala ? Math.round((p.precio * (100 - escala.descuento)) / 100) : p.precio;
}

/* Las escalas en limpio: cantidades de 2 a 999 sin repetir, descuentos de 1 a 90 %, ordenadas. */
export const limpiarEscalas = (escalas: Escala[]) =>
  escalas
    .map((e) => ({ cantidad: Math.floor(e.cantidad), descuento: Math.floor(e.descuento) }))
    .filter((e, n, todas) => e.cantidad >= 2 && e.cantidad <= 999 && e.descuento >= 1 && e.descuento <= 90 && todas.findIndex((o) => o.cantidad === e.cantidad) === n)
    .sort((a, b) => a.cantidad - b.cantidad)
    .slice(0, 6);

export type Categorias = Partial<Record<TipoProducto, [id: string, nombre: string][]>>;

export const agotado = (p: Pick<Producto, "stock">) => p.stock === 0;
export const enOferta = (p: Pick<Producto, "precio" | "precioAnterior">) => (p.precioAnterior ?? 0) > p.precio;

/* Las categorías iniciales. Con Supabase se editan desde el panel (tabla categorias). */
export const CATEGORIAS: Categorias = {
  fisico: [
    ["cuadernos", "Cuadernos y libretas"],
    ["agendas", "Agendas y planners"],
    ["stickers", "Stickers y washi"],
    ["escritura", "Para escribir"],
    ["tarjetas", "Tarjetas y notas"],
  ],
  descargable: [
    ["planners", "Planners"],
    ["estudio", "Estudio"],
    ["hogar", "Casa y finanzas"],
    ["festejos", "Festejos"],
  ],
};

/* Respaldo: lo que muestra la tienda si Supabase no está conectado o no responde.
   Vacío a propósito: sin productos, la tienda muestra el aviso de "estamos fabricando". */
export const PRODUCTOS: Producto[] = [];

/* Dibujos de línea. Todos en un lienzo de 200 × 150.
   Clases: t = trazo tinta, fc = color del producto, fn = nube, fh/fl/fa/fm/fs = colores de marca. */

const hojaBase = '<path class="t fn" d="M56 14h72l20 20v102H56z"/><path class="t fc" d="M128 14v20h20z"/>';

const DIBUJOS = {
  cuaderno:
    '<rect class="t fc" x="58" y="16" width="92" height="118" rx="7"/>' +
    '<path class="t sin" d="M74 16v118"/>' +
    '<rect class="t fn" x="88" y="40" width="48" height="28" rx="3"/>' +
    '<path class="fino" d="M96 50h32M96 58h20"/>' +
    '<path class="t sin" d="M140 16v118"/>',
  libreta:
    '<rect class="t fc" x="66" y="26" width="72" height="108" rx="6"/>' +
    '<path class="t sin" d="M78 20v14M90 20v14M102 20v14M114 20v14M126 20v14"/>' +
    '<rect class="t fn" x="82" y="58" width="40" height="22" rx="3"/>' +
    '<path class="fino" d="M90 69h24"/>',
  agenda:
    '<rect class="t fc" x="60" y="16" width="92" height="118" rx="7"/>' +
    '<path class="t fn" d="M152 34h10a4 4 0 0 1 4 4v14h-14zM152 60h10a4 4 0 0 1 4 4v14h-14z"/>' +
    '<circle class="t fn" cx="60" cy="32" r="5"/><circle class="t fn" cx="60" cy="52" r="5"/><circle class="t fn" cx="60" cy="72" r="5"/><circle class="t fn" cx="60" cy="92" r="5"/><circle class="t fn" cx="60" cy="112" r="5"/>' +
    '<text x="110" y="82" text-anchor="middle" style="font-family:var(--fuente-titulo)" font-size="24" class="ft">2027</text>',
  block:
    '<rect class="t fn" x="50" y="22" width="100" height="110" rx="5"/>' +
    '<rect class="t fc" x="50" y="22" width="100" height="20" rx="5"/>' +
    '<rect class="t sin" x="62" y="54" width="10" height="10" rx="2"/><rect class="t sin" x="62" y="74" width="10" height="10" rx="2"/><rect class="t sin" x="62" y="94" width="10" height="10" rx="2"/><rect class="t sin" x="62" y="114" width="10" height="10" rx="2"/>' +
    '<path class="fino" d="M82 59h54M82 79h40M82 99h50M82 119h30"/>' +
    '<path class="t sin" d="M63 58l3 4 6-8"/>',
  stickers:
    '<rect class="t fn" x="50" y="18" width="100" height="116" rx="8"/>' +
    '<path class="t fc" d="M78 34l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z"/>' +
    '<circle class="t fl" cx="124" cy="48" r="13"/>' +
    '<path class="t fs" d="M66 104a9 9 0 0 1 4-17 12 12 0 0 1 23-2 10 10 0 0 1 8 19z"/>' +
    '<path class="t fa" d="M124 116s-14-9-14-19a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 10-14 19-14 19z"/>',
  washi:
    '<circle class="t fc" cx="72" cy="58" r="34"/><circle class="t fn" cx="72" cy="58" r="14"/>' +
    '<circle class="t fh" cx="132" cy="64" r="30"/><circle class="t fn" cx="132" cy="64" r="12"/>' +
    '<circle class="t fl" cx="100" cy="102" r="30"/><circle class="t fn" cx="100" cy="102" r="12"/>',
  lapiceras:
    '<g transform="rotate(-24 100 75)">' +
    '<rect class="t fc" x="58" y="22" width="14" height="96" rx="7"/><path class="t ft" d="M60 118h10l-5 14z"/>' +
    '<rect class="t fh" x="82" y="22" width="14" height="96" rx="7"/><path class="t ft" d="M84 118h10l-5 14z"/>' +
    '<rect class="t fa" x="106" y="22" width="14" height="96" rx="7"/><path class="t ft" d="M108 118h10l-5 14z"/>' +
    '<rect class="t fm" x="130" y="22" width="14" height="96" rx="7"/><path class="t ft" d="M132 118h10l-5 14z"/>' +
    '</g>',
  resaltadores:
    '<rect class="t fc" x="48" y="48" width="26" height="86" rx="6"/><path class="t fn" d="M53 48V30l16-8v26z"/>' +
    '<rect class="t fl" x="87" y="48" width="26" height="86" rx="6"/><path class="t fn" d="M92 48V30l16-8v26z"/>' +
    '<rect class="t fm" x="126" y="48" width="26" height="86" rx="6"/><path class="t fn" d="M131 48V30l16-8v26z"/>',
  tarjetas:
    '<rect class="t fn" x="70" y="18" width="92" height="66" rx="5" transform="rotate(8 116 51)"/>' +
    '<path class="fino" d="M92 44h48M94 56h34" transform="rotate(8 116 51)"/>' +
    '<rect class="t fc" x="36" y="62" width="104" height="70" rx="5"/>' +
    '<path class="t sin" d="M36 66l52 38 52-38"/>',
  pack:
    '<rect class="t fc" x="46" y="62" width="108" height="72" rx="5"/>' +
    '<rect class="t fc" x="38" y="46" width="124" height="22" rx="5"/>' +
    '<rect class="t fn" x="90" y="46" width="20" height="88"/>' +
    '<path class="t fn" d="M100 46c-10-26-40-22-32-6 4 8 20 8 32 6zM100 46c10-26 40-22 32-6-4 8-20 8-32 6z"/>',
  "hoja-semana":
    hojaBase +
    '<rect class="fc" x="66" y="44" width="72" height="10" rx="2"/>' +
    '<path class="fino" d="M66 62h72M66 126h72M66 62v64M84 62v64M102 62v64M120 62v64M138 62v64M66 84h72M66 105h72"/>',
  "hoja-mes":
    hojaBase +
    '<path class="fino" d="M66 46h46"/>' +
    '<g class="fc"><rect x="66" y="58" width="12" height="12" rx="2"/><rect x="96" y="58" width="12" height="12" rx="2"/><rect x="81" y="74" width="12" height="12" rx="2"/><rect x="126" y="74" width="12" height="12" rx="2"/><rect x="66" y="90" width="12" height="12" rx="2"/><rect x="111" y="90" width="12" height="12" rx="2"/><rect x="96" y="106" width="12" height="12" rx="2"/></g>' +
    '<g class="fino"><rect x="81" y="58" width="12" height="12" rx="2"/><rect x="111" y="58" width="12" height="12" rx="2"/><rect x="126" y="58" width="12" height="12" rx="2"/><rect x="66" y="74" width="12" height="12" rx="2"/><rect x="96" y="74" width="12" height="12" rx="2"/><rect x="111" y="74" width="12" height="12" rx="2"/><rect x="81" y="90" width="12" height="12" rx="2"/><rect x="96" y="90" width="12" height="12" rx="2"/><rect x="126" y="90" width="12" height="12" rx="2"/><rect x="66" y="106" width="12" height="12" rx="2"/><rect x="81" y="106" width="12" height="12" rx="2"/><rect x="111" y="106" width="12" height="12" rx="2"/><rect x="126" y="106" width="12" height="12" rx="2"/></g>',
  "hoja-lista":
    hojaBase +
    '<rect class="fc" x="66" y="44" width="40" height="10" rx="2"/>' +
    '<path class="fino" d="M66 62v62M80 68h56M80 82h44M80 96h52M80 110h36M66 124h72"/>' +
    '<circle class="fc" cx="72" cy="68" r="3"/><circle class="fc" cx="72" cy="82" r="3"/><circle class="fc" cx="72" cy="96" r="3"/><circle class="fc" cx="72" cy="110" r="3"/>',
  "hoja-etiquetas":
    hojaBase +
    '<rect class="t fc" x="66" y="46" width="32" height="20" rx="6"/><rect class="t fn" x="106" y="46" width="32" height="20" rx="6"/>' +
    '<rect class="t fn" x="66" y="74" width="32" height="20" rx="6"/><rect class="t fc" x="106" y="74" width="32" height="20" rx="6"/>' +
    '<rect class="t fc" x="66" y="102" width="32" height="20" rx="6"/><rect class="t fn" x="106" y="102" width="32" height="20" rx="6"/>',
  "hoja-fiesta":
    hojaBase +
    '<path class="fino" d="M62 48q40 16 80 4"/>' +
    '<path class="t fc" d="M68 51l12 3-9 16z"/><path class="t fl" d="M88 56l12 1-7 17z"/><path class="t fh" d="M108 57l12-2-4 18z"/><path class="t fa" d="M126 54l11-3-1 18z"/>' +
    '<rect class="t fn" x="72" y="88" width="56" height="36" rx="4"/><path class="fino" d="M82 100h36M86 110h28"/>',
};

export const NOMBRES_DIBUJO = Object.keys(DIBUJOS) as NombreDibujo[];

export const COLORES: [ColorProducto, string][] = [
  ["lavanda", "Rosa"],
  ["amanecer", "Vino"],
  ["halo", "Lima"],
  ["menta", "Verde claro"],
];

export const TIPOS: [TipoProducto, string][] = [
  ["fisico", "Papelería"],
  ["descargable", "Descargable"],
  ["pack", "Pack regalo"],
];

export const rutaProducto = (id: string) => `/producto/${id}`;

/* "Vuelta al cole" → "vuelta-al-cole": así se comparan las etiquetas con las secciones y se arma la dirección. */
export const idEtiqueta = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const rutaSeccion = (etiqueta: string) => `/seccion/${idEtiqueta(etiqueta)}`;
/* Sin repetidas (tampoco "Escuela" y "escuela"), cortas y sin las que no tienen ni una letra. */
export const limpiarEtiquetas = (lista: string[]) =>
  lista
    .map((e) => e.trim().replace(/\s+/g, " ").slice(0, 40))
    .filter((e, n, todas) => idEtiqueta(e) && todas.findIndex((otra) => idEtiqueta(otra) === idEtiqueta(e)) === n)
    .slice(0, 20);
export const tieneEtiqueta = (p: Pick<Producto, "etiquetas">, id: string) => (p.etiquetas ?? []).some((e) => idEtiqueta(e) === id);

/* La sección del catálogo a la que pertenece cada tipo de producto. */
export const SECCIONES: Record<TipoProducto, { ruta: string; nombre: string; entrega: string }> = {
  fisico: { ruta: "/papeleria", nombre: "Papelería", entrega: "Te lo mandamos envuelto a tu casa. El envío se coordina por WhatsApp al cerrar el pedido." },
  descargable: { ruta: "/descargables", nombre: "Descargables", entrega: "Te llega por mail en PDF apenas se acredita el pago. Lo imprimís todas las veces que quieras." },
  pack: { ruta: "/packs-regalo", nombre: "Packs regalo", entrega: "Va en caja, envuelto y con una tarjeta escrita a mano con el mensaje que nos digas." },
};

export function Dibujo({ nombre, color }: { nombre: NombreDibujo; color: ColorProducto }) {
  return (
    <svg
      className="il"
      viewBox="0 0 200 150"
      aria-hidden="true"
      style={{ "--c": `var(--color-${color})` } as CSSProperties}
      dangerouslySetInnerHTML={{ __html: DIBUJOS[nombre] }}
    />
  );
}
