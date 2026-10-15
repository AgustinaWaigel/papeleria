type Pagina = [href: string, nombre: string];

/* Secciones guardadas para más adelante. Para abrir una, pasala a true.
   - personalizados y packs: salen del menú, en Inicio figuran como "Próximamente" y su página muestra que las
     estamos preparando. Con packs en false la tienda tampoco muestra los productos de tipo pack (desde el panel
     se pueden ir cargando igual).
   - ideas (el Cuaderno de ideas): no aparece en ningún lado y su dirección da "página no encontrada". */
export const ABIERTAS = { personalizados: false, packs: false, ideas: false };

const OCULTAS = [
  !ABIERTAS.personalizados && "/personalizados",
  !ABIERTAS.packs && "/packs-regalo",
  !ABIERTAS.ideas && "/cuaderno-de-ideas",
].filter(Boolean);
export const visible = (href: string) => !OCULTAS.includes(href);

export const PAGINAS: Pagina[] = (
  [
    ["/papeleria", "Papelería"],
    ["/descargables", "Descargables"],
    ["/personalizados", "Personalizados"],
    ["/packs-regalo", "Packs regalo"],
    ["/cuaderno-de-ideas", "Cuaderno de ideas"],
  ] satisfies Pagina[]
).filter(([href]) => visible(href));

export const PAGINAS_PIE: Pagina[] = (
  [
    ["/buscar", "Buscar"],
    ["/cuaderno-de-ideas", "Cuaderno de ideas"],
    ["/sobre-nosotras", "Sobre nosotras"],
    ["/preguntas-frecuentes", "Preguntas frecuentes"],
    ["/contacto", "Contacto"],
  ] satisfies Pagina[]
).filter(([href]) => visible(href));
