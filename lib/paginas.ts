import { CATALOGO, SECCIONES_ABIERTAS } from "./marca";

type Pagina = [href: string, nombre: string];

/* Secciones que se pueden abrir o guardar para más adelante. Se abren desde SECCIONES_ABIERTAS en rubros/<rubro>.env (por ejemplo "descargables,personalizados,por-mayor").
   - personalizados y packs cerradas: salen del menú, en Inicio de la papelería figuran como "Próximamente" y su
     página muestra que las estamos preparando. Con packs cerrada la tienda tampoco muestra los productos de tipo
     pack (desde el panel se pueden ir cargando igual).
   - descargables, por-mayor, ideas (el Cuaderno de ideas) y listas (Listas escolares) cerradas: no aparecen en
     ningún lado y su dirección da "página no encontrada". Sin descargables, tampoco se muestran esos productos. */
export const ABIERTAS = SECCIONES_ABIERTAS;

const OCULTAS = [
  !ABIERTAS.descargables && "/descargables",
  !ABIERTAS.descargables && "/como-imprimir",
  !ABIERTAS.porMayor && "/pedidos-por-mayor",
  !ABIERTAS.personalizados && "/personalizados",
  !ABIERTAS.packs && "/packs-regalo",
  !ABIERTAS.ideas && "/cuaderno-de-ideas",
  !ABIERTAS.listas && "/listas-escolares",
].filter(Boolean);
export const visible = (href: string) => !OCULTAS.includes(href);

export const PAGINAS: Pagina[] = (
  [
    [CATALOGO.ruta, CATALOGO.nombre],
    ["/descargables", "Descargables"],
    ["/personalizados", "Personalizados"],
    ["/listas-escolares", "Listas escolares"],
    ["/packs-regalo", "Packs regalo"],
    ["/pedidos-por-mayor", "Por mayor"],
    ["/cuaderno-de-ideas", "Cuaderno de ideas"],
  ] satisfies Pagina[]
).filter(([href]) => visible(href));

/* Las de PAGINAS que en la cabecera van adentro del menú "Productos", junto con las secciones. */
export const RUTAS_PRODUCTOS = [CATALOGO.ruta, "/descargables", "/personalizados", "/listas-escolares", "/packs-regalo"];

export const PAGINAS_PIE: Pagina[] = (
  [
    ["/buscar", "Buscar"],
    ["/como-imprimir", "Cómo imprimir los descargables"],
    ["/pedidos-por-mayor", "Pedidos por mayor"],
    ["/cuaderno-de-ideas", "Cuaderno de ideas"],
    ["/sobre-nosotras", "Sobre nosotras"],
    ["/preguntas-frecuentes", "Preguntas frecuentes"],
    ["/contacto", "Contacto"],
  ] satisfies Pagina[]
).filter(([href]) => visible(href));

/* Lo legal: va en el pie de todas las páginas (el botón de arrepentimiento tiene que estar a mano, Res. 424/2020). */
export const PAGINAS_LEGALES: Pagina[] = [
  ["/arrepentimiento", "Botón de arrepentimiento"],
  ["/terminos", "Términos y condiciones"],
  ["/privacidad", "Privacidad"],
];
