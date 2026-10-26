type Pagina = [href: string, nombre: string];

/* Secciones guardadas para más adelante. Para abrir una, pasala a true.
   - personalizados y packs: salen del menú, en Inicio figuran como "Próximamente" y su página muestra que las
     estamos preparando. Con packs en false la tienda tampoco muestra los productos de tipo pack (desde el panel
     se pueden ir cargando igual).
   - ideas (el Cuaderno de ideas) y listas (Listas escolares): no aparecen en ningún lado y su dirección da
     "página no encontrada". */
export const ABIERTAS = { personalizados: true, packs: false, ideas: false, listas: false };

const OCULTAS = [
  !ABIERTAS.personalizados && "/personalizados",
  !ABIERTAS.packs && "/packs-regalo",
  !ABIERTAS.ideas && "/cuaderno-de-ideas",
  !ABIERTAS.listas && "/listas-escolares",
].filter(Boolean);
export const visible = (href: string) => !OCULTAS.includes(href);

export const PAGINAS: Pagina[] = (
  [
    ["/papeleria", "Papelería"],
    ["/descargables", "Descargables"],
    ["/personalizados", "Personalizados"],
    ["/listas-escolares", "Listas escolares"],
    ["/packs-regalo", "Packs regalo"],
    ["/pedidos-por-mayor", "Por mayor"],
    ["/cuaderno-de-ideas", "Cuaderno de ideas"],
  ] satisfies Pagina[]
).filter(([href]) => visible(href));

/* Las de PAGINAS que en la cabecera van adentro del menú "Productos", junto con las secciones. */
export const RUTAS_PRODUCTOS = ["/papeleria", "/descargables", "/personalizados", "/listas-escolares", "/packs-regalo"];

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
