/* Alas de Ángel — catálogo inicial.
   Con Supabase conectado, los productos se cargan y editan desde el panel (/admin) y esta lista
   solo sirve para llenar la tabla la primera vez (supabase/semilla.sql) y como respaldo si la base
   no responde. Sin Supabase, la tienda muestra exactamente esta lista. Los precios y textos son de ejemplo.

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
};

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

export const PRODUCTOS: Producto[] = [
  // ----- Papelería (físicos) -----
  { id: "cuaderno-pluma", tipo: "fisico", cat: "cuadernos", nombre: "Cuaderno Pluma", desc: "Tapa dura, cosido a hilo y con elástico. Abre plano, de punta a punta.", detalle: "A5 · 80 hojas · rayado", precio: 9800, dibujo: "cuaderno", color: "lavanda", destacado: true,
    descripcion: [
      "Es el cuaderno para usar todos los días: entra en la mochila, aguanta el trajín y se abre plano para escribir cómodo hasta el borde de la hoja.",
      "Las hojas son gruesas, así que la tinta de gel no traspasa. El elástico lo mantiene cerrado y la cinta marca por dónde ibas.",
    ],
    caracteristicas: ["Tamaño A5 (15 × 21 cm)", "80 hojas rayadas de 90 g", "Tapa dura forrada", "Cosido a hilo: abre plano", "Elástico de cierre y cinta señaladora"],
  },
  { id: "cuaderno-nube", tipo: "fisico", cat: "cuadernos", nombre: "Cuaderno Nube", desc: "El mismo cuaderno, con hojas punteadas para dibujar, diagramar o hacer bullet journal.", detalle: "A5 · 80 hojas · punteado", precio: 9800, dibujo: "cuaderno", color: "menta" },
  { id: "cuaderno-amanecer", tipo: "fisico", cat: "cuadernos", nombre: "Cuaderno Amanecer", desc: "Grande y de hojas lisas, para bocetos, mapas mentales y apuntes sin renglones.", detalle: "A4 · 100 hojas · liso", precio: 13500, dibujo: "cuaderno", color: "amanecer" },
  { id: "libreta-halo", tipo: "fisico", cat: "cuadernos", nombre: "Libreta de bolsillo Halo", desc: "Anillada arriba, entra en cualquier bolsillo. Para la idea que aparece en el colectivo.", detalle: "A6 · 60 hojas · rayado", precio: 5200, dibujo: "libreta", color: "halo" },
  { id: "agenda-2027", tipo: "fisico", cat: "agendas", nombre: "Agenda 2027 semana a la vista", desc: "Anillada, con la semana entera en dos páginas, hoja de objetivos por mes y bolsillo al final.", detalle: "A5 · anillada · tapa dura", precio: 18900, dibujo: "agenda", color: "lavanda", destacado: true },
  { id: "planner-escritorio", tipo: "fisico", cat: "agendas", nombre: "Planner semanal de escritorio", desc: "Un block apaisado sin fechas: arrancás la semana que quieras y cortás la hoja cuando termina.", detalle: "Apaisado · 52 hojas · sin fechas", precio: 8400, dibujo: "block", color: "menta" },
  { id: "stickers-cielo", tipo: "fisico", cat: "stickers", nombre: "Stickers Cielo abierto", desc: "Estrellas, nubes, lunas y plumas para marcar días lindos en la agenda.", detalle: "2 planchas · 48 stickers", precio: 2900, dibujo: "stickers", color: "halo", destacado: true },
  { id: "stickers-habitos", tipo: "fisico", cat: "stickers", nombre: "Stickers Hábitos", desc: "Puntitos, tildes y etiquetas chicas para seguir rutinas sin escribir de más.", detalle: "2 planchas · 120 stickers", precio: 2900, dibujo: "stickers", color: "menta" },
  { id: "washi-amanecer", tipo: "fisico", cat: "stickers", nombre: "Washi tapes trío Amanecer", desc: "Tres cintas de papel que se despegan sin romper la hoja. Lisas, a rayas y a lunares.", detalle: "3 rollos · 15 mm × 5 m", precio: 6300, dibujo: "washi", color: "amanecer" },
  { id: "lapiceras-pastel", tipo: "fisico", cat: "escritura", nombre: "Lapiceras de gel pastel", desc: "Trazo fino y parejo, secan rápido y no traspasan la hoja.", detalle: "6 colores · punta 0,5 mm", precio: 7500, dibujo: "lapiceras", color: "lavanda", destacado: true },
  { id: "resaltadores-suaves", tipo: "fisico", cat: "escritura", nombre: "Resaltadores suaves", desc: "Doble punta, colores que resaltan sin encandilar. Ideales para apuntes.", detalle: "4 colores · doble punta", precio: 6900, dibujo: "resaltadores", color: "halo" },
  { id: "tarjetas-gracias", tipo: "fisico", cat: "tarjetas", nombre: "Tarjetas Gracias", desc: "Tarjetas en blanco por dentro, con su sobre. Para decir gracias a mano, como antes.", detalle: "6 tarjetas + 6 sobres", precio: 5800, dibujo: "tarjetas", color: "amanecer" },
  { id: "block-lista", tipo: "fisico", cat: "tarjetas", nombre: "Block Lista del día", desc: "Tres prioridades, pendientes y un lugar para lo que no puede esperar a mañana.", detalle: "A6 · 50 hojas", precio: 4200, dibujo: "block", color: "lavanda" },

  // ----- Descargables (PDF y plantillas) -----
  { id: "pdf-planner-semanal", tipo: "descargable", cat: "planners", nombre: "Planner semanal imprimible", desc: "Una semana por hoja, con prioridades, pendientes y un rincón para notas.", detalle: "PDF · A4 y A5 · sin fechas", precio: 2500, dibujo: "hoja-semana", color: "lavanda", destacado: true },
  { id: "pdf-planner-mensual", tipo: "descargable", cat: "planners", nombre: "Planner mensual 2027", desc: "Los doce meses con feriados de Argentina y una hoja de objetivos por mes.", detalle: "PDF · A4 · 24 páginas", precio: 3200, dibujo: "hoja-mes", color: "halo", destacado: true },
  { id: "pdf-habitos", tipo: "descargable", cat: "planners", nombre: "Seguimiento de hábitos", desc: "Una grilla de 31 días para pintar un cuadradito por cada día cumplido.", detalle: "PDF · A4 · 3 diseños", precio: 1800, dibujo: "hoja-mes", color: "menta" },
  { id: "pdf-cornell", tipo: "descargable", cat: "estudio", nombre: "Hojas de apuntes método Cornell", desc: "Columna de ideas clave, espacio de notas y resumen al pie. Rayadas y punteadas.", detalle: "PDF · A4 · 4 variantes", precio: 1800, dibujo: "hoja-lista", color: "lavanda" },
  { id: "pdf-examenes", tipo: "descargable", cat: "estudio", nombre: "Planificador de exámenes", desc: "Fechas, temas por materia y cuenta regresiva para repartir el estudio sin ahogarte.", detalle: "PDF · A4 · 6 páginas", precio: 2200, dibujo: "hoja-semana", color: "amanecer", destacado: true },
  { id: "pdf-horario", tipo: "descargable", cat: "estudio", nombre: "Horario de clases", desc: "Plantilla editable: escribís tus materias en la compu y la imprimís lista.", detalle: "PDF editable · A4", precio: 1500, dibujo: "hoja-semana", color: "menta" },
  { id: "pdf-menu", tipo: "descargable", cat: "hogar", nombre: "Menú semanal y lista de compras", desc: "Planificás las comidas de la semana y la lista se arma al lado, por sector del súper.", detalle: "PDF · A4 · 2 páginas", precio: 1800, dibujo: "hoja-lista", color: "halo" },
  { id: "pdf-presupuesto", tipo: "descargable", cat: "hogar", nombre: "Presupuesto del mes", desc: "Ingresos, gastos fijos, gastos hormiga y ahorro, en una sola hoja que se entiende.", detalle: "PDF · A4 · 3 páginas", precio: 2200, dibujo: "hoja-lista", color: "menta" },
  { id: "pdf-etiquetas", tipo: "descargable", cat: "hogar", nombre: "Etiquetas para frascos y cajas", desc: "Para imprimir en papel autoadhesivo. Vienen escritas y también en blanco.", detalle: "PDF · A4 · 60 etiquetas", precio: 1500, dibujo: "hoja-etiquetas", color: "amanecer" },
  { id: "pdf-cumple", tipo: "descargable", cat: "festejos", nombre: "Kit de cumpleaños", desc: "Invitación, banderines, toppers y etiquetas para souvenirs, todo combinado.", detalle: "PDF · A4 · 12 páginas", precio: 3500, dibujo: "hoja-fiesta", color: "halo", destacado: true },
  { id: "pdf-tarjetas-regalo", tipo: "descargable", cat: "festejos", nombre: "Tarjetitas para regalos", desc: "De, para y un espacio para escribir algo lindo. Imprimís, recortás y atás.", detalle: "PDF · A4 · 24 tarjetas", precio: 1500, dibujo: "hoja-etiquetas", color: "lavanda" },

  // ----- Packs regalo -----
  { id: "pack-primer-vuelo", tipo: "pack", nombre: "Pack Primer vuelo", desc: "Para quien empieza algo: una carrera, un trabajo, un proyecto.", contenido: ["Cuaderno Pluma A5", "Lapiceras de gel pastel", "Stickers Cielo abierto", "Tarjeta escrita a mano"], precio: 19900, dibujo: "pack", color: "lavanda", destacado: true },
  { id: "pack-vuelta-a-clases", tipo: "pack", nombre: "Pack Vuelta a clases", desc: "Todo lo que hace falta para arrancar el año con los apuntes en orden.", contenido: ["Cuaderno Amanecer A4", "Resaltadores suaves", "Stickers Hábitos", "Block Lista del día"], precio: 24900, dibujo: "pack", color: "halo" },
  { id: "pack-escritorio", tipo: "pack", nombre: "Pack Escritorio en calma", desc: "Para ordenar la semana y que el escritorio dé ganas de sentarse.", contenido: ["Planner semanal de escritorio", "Agenda 2027", "Washi tapes trío Amanecer"], precio: 29900, dibujo: "pack", color: "menta" },
  { id: "pack-agradecer", tipo: "pack", nombre: "Pack Para agradecer", desc: "Un regalo chico y pensado: para una maestra, una amiga, una madrina.", contenido: ["Libreta de bolsillo Halo", "Tarjetas Gracias", "Stickers Cielo abierto"], precio: 12900, dibujo: "pack", color: "amanecer" },
];

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
