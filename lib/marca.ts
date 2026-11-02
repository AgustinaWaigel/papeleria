/* La marca de la tienda: nombre, textos, contacto, colores, tipografías y estilo.
   Todo sale de las variables de entorno (rubros/<rubro>.env, pisables desde .env.local o Vercel; ver
   next.config.ts). Cada process.env.X va escrito entero a propósito: así Next lo reemplaza por su valor
   también en el navegador. */

const si = (valor: string | undefined) => /^(si|sí|true|1|yes)$/i.test((valor ?? "").trim());
const lista = (valor: string | undefined) =>
  (valor ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

const nombre = process.env.MARCA_NOMBRE || "Mi tienda";
const rubro = process.env.MARCA_RUBRO || "";

export const MARCA = {
  rubroId: process.env.RUBRO || "papeleria",
  nombre,
  rubro,
  /* "Alas de Ángel Papelería": para títulos, pie, mails y Google. */
  completo: rubro ? `${nombre} ${rubro}` : nombre,
  lema: process.env.MARCA_LEMA || "",
  descripcion: process.env.MARCA_DESCRIPCION || "",
  nota: process.env.MARCA_NOTA || "",
  /* Lo que se ve en el resumen de la tarjeta: en mayúsculas, sin tildes y hasta 22 letras. */
  descriptor: (process.env.MARCA_DESCRIPTOR || nombre)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .slice(0, 22),
  /* Sin tildes, para nombres de archivo ("Planner - Alas de Angel.pdf"). */
  nombreArchivo: nombre.normalize("NFD").replace(/[̀-ͯ]/g, ""),
  inicial: nombre.trim().charAt(0).toUpperCase() || "•",
  logo: process.env.MARCA_LOGO || "inicial",
  ilustracion: process.env.MARCA_ILUSTRACION || "logo",
  mailCabecera: process.env.MARCA_MAIL_CABECERA || "",
};

export const PORTADA = {
  titulo: process.env.PORTADA_TITULO || nombre,
  resalte: process.env.PORTADA_RESALTE || "",
  texto: process.env.PORTADA_TEXTO || MARCA.descripcion,
  notaDestacados: process.env.PORTADA_NOTA_DESTACADOS || "lo nuevo",
  tituloDestacados: process.env.PORTADA_TITULO_DESTACADOS || "Destacados",
};

const ruta = (process.env.CATALOGO_RUTA || "papeleria").replace(/^\/+|\/+$/g, "");

/* La página de productos físicos (vive en app/(tienda)/papeleria; next.config.ts la muestra en esta dirección). */
export const CATALOGO = {
  ruta: `/${ruta}`,
  nombre: process.env.CATALOGO_NOMBRE || "Productos",
  texto: process.env.CATALOGO_TEXTO || "",
  boton: process.env.CATALOGO_BOTON || "Ver productos",
  /* El encabezado de la página del catálogo. */
  nota: process.env.CATALOGO_NOTA || process.env.MARCA_NOTA || "",
  intro: process.env.CATALOGO_INTRO || process.env.CATALOGO_TEXTO || "",
};

const abiertas = lista(process.env.SECCIONES_ABIERTAS);
export const SECCIONES_ABIERTAS = {
  descargables: abiertas.includes("descargables"),
  personalizados: abiertas.includes("personalizados"),
  packs: abiertas.includes("packs"),
  ideas: abiertas.includes("ideas"),
  listas: abiertas.includes("listas"),
  porMayor: abiertas.includes("por-mayor"),
};

export const CONTACTO_MARCA = {
  whatsapp: (process.env.CONTACTO_WHATSAPP || "").replace(/\D/g, ""),
  email: process.env.CONTACTO_EMAIL || "",
  instagram: (process.env.CONTACTO_INSTAGRAM || "").replace(/^@/, ""),
  tiktok: (process.env.CONTACTO_TIKTOK || "").replace(/^@/, ""),
};

/* Los colores. Las claves son los nombres internos de marca/tokens.css (los usa todo el CSS);
   el comentario dice qué variable de entorno los define. */
export const COLORES = {
  nube: process.env.COLOR_FONDO || "#F6E7D4", // COLOR_FONDO: fondo de página
  cielo: process.env.COLOR_FONDO_ALT || "#F9D5E4", // COLOR_FONDO_ALT: secciones alternas, texto del pie
  tinta: process.env.COLOR_TEXTO || "#0B5E41", // COLOR_TEXTO: texto, bordes, pie
  "tinta-suave": process.env.COLOR_TEXTO_SUAVE || "#2F6E55", // COLOR_TEXTO_SUAVE
  renglon: process.env.COLOR_LINEA || "#E3CDB6", // COLOR_LINEA: líneas finas
  amanecer: process.env.COLOR_PRINCIPAL || "#7F2350", // COLOR_PRINCIPAL: portada, logo, bloques
  "amanecer-fuerte": process.env.COLOR_PRINCIPAL_FUERTE || "#6A1B42", // COLOR_PRINCIPAL_FUERTE: links, botones
  "amanecer-suave": process.env.COLOR_PRINCIPAL_SUAVE || "#EBC3D6", // COLOR_PRINCIPAL_SUAVE
  halo: process.env.COLOR_ACENTO || "#B9D53B", // COLOR_ACENTO: resaltes y botón de la portada
  "halo-suave": process.env.COLOR_ACENTO_SUAVE || "#E6F0B4", // COLOR_ACENTO_SUAVE
  lavanda: process.env.COLOR_SECUNDARIO || "#F4A9CB", // COLOR_SECUNDARIO
  "lavanda-suave": process.env.COLOR_SECUNDARIO_SUAVE || "#FBDCE9", // COLOR_SECUNDARIO_SUAVE
  menta: process.env.COLOR_TERCIARIO || "#7CC4A0", // COLOR_TERCIARIO
  "menta-suave": process.env.COLOR_TERCIARIO_SUAVE || "#D5EEDF", // COLOR_TERCIARIO_SUAVE
};

export const FUENTES = {
  titulos: process.env.FUENTE_TITULOS || "Londrina Solid",
  texto: process.env.FUENTE_TEXTO || "Karla",
  etiquetas: process.env.FUENTE_ETIQUETAS || process.env.FUENTE_TEXTO || "Karla",
  mano: process.env.FUENTE_MANO || "",
  mayusculas: si(process.env.TITULOS_MAYUSCULAS ?? "si"),
  escala: Number(process.env.TEXTO_ESCALA) > 0 ? Number(process.env.TEXTO_ESCALA) : 1,
};

export const ESTILO = {
  radioChico: process.env.ESTILO_RADIO_CHICO || "6px",
  radio: process.env.ESTILO_RADIO || "14px",
  radioGrande: process.env.ESTILO_RADIO_GRANDE || "28px",
  radioPastilla: process.env.ESTILO_RADIO_PASTILLA || "999px",
  linea: process.env.ESTILO_LINEA || "1.5px",
  sombra: (process.env.ESTILO_SOMBRA || "sello").toLowerCase(),
  desplazamiento: process.env.ESTILO_SOMBRA_DESPLAZAMIENTO || "4px",
  patron: si(process.env.ESTILO_PATRON ?? "si"),
  ancho: process.env.ESTILO_ANCHO || "72rem",
};
