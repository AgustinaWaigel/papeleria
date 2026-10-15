type Pagina = [href: string, nombre: string];

/* Secciones guardadas para más adelante. Mientras estén en false no aparecen en el menú, en Inicio
   figuran como "Próximamente", su página muestra que las estamos preparando y la tienda no muestra los productos de tipo pack
   (desde el panel se pueden ir cargando igual). Para abrir una, pasala a true. */
export const ABIERTAS = { personalizados: false, packs: false };

const OCULTAS = [!ABIERTAS.personalizados && "/personalizados", !ABIERTAS.packs && "/packs-regalo"].filter(Boolean);
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

export const PAGINAS_PIE: Pagina[] = [
  ["/buscar", "Buscar"],
  ["/cuaderno-de-ideas", "Cuaderno de ideas"],
  ["/sobre-nosotras", "Sobre nosotras"],
  ["/preguntas-frecuentes", "Preguntas frecuentes"],
  ["/contacto", "Contacto"],
];
