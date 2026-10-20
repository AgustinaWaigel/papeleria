/* Datos de contacto: cambiá estos valores por los reales.
   El WhatsApp va con código de país y sin signos: 54 9 + característica + número. */
export const CONTACTO = {
  whatsapp: "5493434042410",
  email: "papeleria.alasdeangel@gmail.com",
  instagram: "alasdeangel.papeleria",
  tiktok: "alasdeangel.papeleria",
};

export const enlaceWhatsApp = (texto: string) =>
  `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(texto)}`;

export const enlaceInstagram = `https://instagram.com/${CONTACTO.instagram}`;

export const enlaceTiktok = `https://www.tiktok.com/@${CONTACTO.tiktok}`;

const formato = new Intl.NumberFormat("es-AR");
export const precio = (pesos: number) => `$ ${formato.format(pesos)}`;
