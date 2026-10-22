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

/* Cuánto lleva preparar un pedido con productos físicos. Se muestra antes de pagar, en el seguimiento, en el mail
   de confirmación, en las preguntas frecuentes y en los términos: si cambia, cambia en todos lados. */
export const PLAZO_TALLER =
  "Todo lo hacemos a mano, así que preparar tu pedido lleva de 5 a 10 días hábiles, según lo que lleve. Después sale el envío (o te avisamos para que lo retires).";

export const enlaceInstagram =`https://instagram.com/${CONTACTO.instagram}`;

export const enlaceTiktok = `https://www.tiktok.com/@${CONTACTO.tiktok}`;

const formato = new Intl.NumberFormat("es-AR");
export const precio = (pesos: number) => `$ ${formato.format(pesos)}`;
