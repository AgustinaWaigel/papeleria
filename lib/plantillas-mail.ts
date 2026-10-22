/* El contenido de los mails de la tienda: asunto, HTML (con la plantilla de la marca) y texto plano.
   No manda nada ni lee la base: recibe los datos y arma el mail. Lo usa lib/mails.ts para mandarlos, y
   sirve para ver cómo quedan sin mandarlos. */

import { CONTACTO, enlaceInstagram, PLAZO_TALLER, precio } from "./contacto";
import { CABECERA_CID } from "./mail-cabecera";
import { linkDeSeguimiento, type Entrega } from "./seguimiento";
import { SITIO_URL } from "./sitio";

export type Mail = { subject: string; html: string; text: string };

/* Lo que hace falta de un pedido para armar sus mails. */
export type PedidoMail = {
  codigo: string;
  clave: string;
  entrega: Entrega | null;
  direccion: string | null;
  seguimiento: string | null;
  cliente_nombre: string | null;
  cliente_email: string | null;
  medio_pago: string | null;
  total: number;
  costo_envio: number;
  descuento: number;
  cupon: string | null;
  pedido_items: { producto_id: string | null; nombre: string; precio_unitario: number; cantidad: number }[];
};

const verPedido = (p: PedidoMail) => ({ texto: `Ver mi pedido ${p.codigo}`, url: linkDeSeguimiento(p.codigo, p.clave) });
const destacado = (etiqueta: string, valor: string) =>
  `<span style="font-size: 13px; color: ${C.tintaSuave};">${escapar(etiqueta)}</span><br><strong style="font-family: ${TITULO}; font-size: 22px; letter-spacing: 1px;">${escapar(valor)}</strong>`;

// ---------- Para quien compra ----------

/* Los PDF de los descargables: los nombres de los adjuntos y, si alguno pesaba mucho, su link. */
export function mailDescargables(p: PedidoMail, adjuntos: string[], links: { nombre: string; url: string }[]): Mail {
  const intro = adjuntos.length > 0 ? "Gracias por tu compra. Te adjuntamos tus descargables:" : "Gracias por tu compra. Acá están tus descargables:";
  return {
    subject: `Tus descargables de Alas de Ángel · pedido ${p.codigo}`,
    html: plantilla({
      nota: "recién salido del taller",
      titulo: saludo(p.cliente_nombre),
      bloques: [
        parrafo(escapar(intro)),
        pastillas([
          ...adjuntos.map((a) => `<span style="font-size: 18px;">&#128206;</span>&nbsp; <strong>${escapar(a)}</strong>`),
          ...links.map(
            (l) =>
              `<span style="font-size: 18px;">&#11015;&#65039;</span>&nbsp; <a href="${escapar(l.url)}" style="color: ${C.bordo}; font-weight: bold;">${escapar(l.nombre)}</a><br><span style="font-size: 13px; color: ${C.tintaSuave};">Pesa mucho para adjuntarlo: bajalo desde el link en los próximos 7 días.</span>`,
          ),
        ]),
        parrafo(`Guardalos en tu compu o en el celular: los podés ${resaltado("imprimir todas las veces que quieras")}.`),
      ],
      boton: verPedido(p),
    }),
    text: textoPlano([
      saludo(p.cliente_nombre),
      "",
      intro,
      ...adjuntos.map((a) => `• ${a}`),
      ...links.map((l) => `• ${l.nombre} (bajalo desde acá en los próximos 7 días): ${l.url}`),
      "",
      "Los podés imprimir todas las veces que quieras.",
      `Tu pedido ${p.codigo}: ${verPedido(p).url}`,
    ]),
  };
}

/* "¡Recibimos tu compra!": el detalle, el total y qué sigue. */
export function mailConfirmacion(p: PedidoMail, conDescargables: boolean): Mail {
  const sigue =
    p.entrega === "envio"
      ? `Lo preparamos y te avisamos por acá cuando salga${p.direccion ? ` para <strong>${escapar(p.direccion)}</strong>` : ""}, con el número de seguimiento.`
      : p.entrega === "retiro"
        ? "Lo preparamos y te escribimos por WhatsApp para coordinar dónde y cuándo retirarlo."
        : "Lo preparamos y te escribimos para coordinar la entrega.";
  // Este mail sale solo si el pedido lleva algo físico (ver enviarConfirmacion en lib/mails.ts).
  const plazo = `${PLAZO_TALLER} Si tenés alguna duda o lo necesitás para una fecha, respondé este mail o escribinos por WhatsApp.`;
  return {
    subject: `¡Recibimos tu compra! · pedido ${p.codigo}`,
    html: plantilla({
      nota: "ya está en el taller",
      titulo: saludo(p.cliente_nombre),
      bloques: [
        parrafo("¡Gracias por tu compra! Ya recibimos el pago. Esto es lo que llevás:"),
        detalle(p),
        parrafo(plazo),
        parrafo(sigue),
        ...(conDescargables ? [parrafo("Los descargables te llegan en otro mail, con los PDF adjuntos.")] : []),
      ],
      boton: verPedido(p),
    }),
    text: textoPlano([
      saludo(p.cliente_nombre),
      "",
      "¡Gracias por tu compra! Ya recibimos el pago.",
      ...lineasDetalle(p),
      "",
      plazo,
      sigue.replace(/<[^>]+>/g, ""),
      `Tu pedido: ${verPedido(p).url}`,
    ]),
  };
}

/* Cuando pasa a "enviado": en camino (con el número de seguimiento) o listo para retirar. */
export function mailEnvio(p: PedidoMail): Mail {
  const retiro = p.entrega === "retiro";
  const titulo = retiro ? "¡Tu pedido está listo para retirar!" : "¡Tu pedido está en camino!";
  const cuerpo = retiro
    ? "Ya lo tenemos envuelto y esperándote. Escribinos por WhatsApp (o respondé este mail) para coordinar cuándo pasás a buscarlo."
    : "Ya salió del taller. Pronto lo tenés en tus manos.";
  return {
    subject: `${titulo} · pedido ${p.codigo}`,
    html: plantilla({
      nota: retiro ? "te espera en el taller" : "volando hacia vos",
      titulo,
      bloques: [
        parrafo(`${escapar(saludo(p.cliente_nombre))} ${cuerpo}`),
        ...(p.seguimiento ? [pastillas([destacado("Número de seguimiento del envío", p.seguimiento)])] : []),
        detalle(p),
      ],
      boton: verPedido(p),
    }),
    text: textoPlano([
      titulo,
      "",
      `${saludo(p.cliente_nombre)} ${cuerpo}`,
      ...(p.seguimiento ? [`Número de seguimiento: ${p.seguimiento}`] : []),
      `Tu pedido: ${verPedido(p).url}`,
    ]),
  };
}

/* "¡Volvió!": a quien pidió aviso cuando un producto agotado vuelve a tener stock. */
export function mailStock(nombre: string, url: string): Mail {
  return {
    subject: `¡Volvió ${nombre}!`,
    html: plantilla({
      nota: "recién repuesto",
      titulo: `¡Volvió ${nombre}!`,
      bloques: [parrafo("Nos pediste que te avisáramos: ya lo tenemos de nuevo. Suele volar rápido, así que si lo querés, no esperes mucho.")],
      boton: { texto: "Verlo en la tienda", url },
    }),
    text: textoPlano([`¡Volvió ${nombre}!`, "", "Nos pediste que te avisáramos: ya lo tenemos de nuevo.", url]),
  };
}

export type DatosArrepentimiento = { codigo: string; nombre: string; email: string; pedido: string; motivo: string; telefono: string };

/* El comprobante del pedido de arrepentimiento, con su código de trámite. */
export function mailArrepentimiento(d: DatosArrepentimiento): Mail {
  return {
    subject: `Recibimos tu pedido de arrepentimiento · ${d.codigo}`,
    html: plantilla({
      nota: "botón de arrepentimiento",
      titulo: "Recibimos tu pedido",
      bloques: [
        parrafo(`${escapar(saludo(d.nombre))} Registramos tu pedido para cancelar la compra${d.pedido ? ` <strong>${escapar(d.pedido)}</strong>` : ""}.`),
        pastillas([destacado("Código de trámite", d.codigo)]),
        parrafo("Te escribimos dentro de las próximas 24 horas para coordinar la devolución. Guardá este mail: el código sirve de comprobante."),
      ],
    }),
    text: textoPlano([
      "Recibimos tu pedido de arrepentimiento.",
      `Código de trámite: ${d.codigo}`,
      "Te escribimos dentro de las próximas 24 horas para coordinar la devolución.",
    ]),
  };
}

// ---------- Para la tienda ----------

function mailAviso(asunto: string, lineas: string[], enlace: string): Mail {
  return {
    subject: asunto,
    html: plantilla({ nota: "para el taller", titulo: asunto, bloques: lineas.map((l) => parrafo(escapar(l))), boton: { texto: "Abrir el panel", url: enlace } }),
    text: textoPlano([asunto, "", ...lineas, "", enlace]),
  };
}

/* "Nueva venta": lo que se vendió y cómo se entrega. */
export function mailVenta(p: PedidoMail): Mail {
  return mailAviso(
    `Nueva venta ${p.codigo} · ${precio(p.total)}`,
    [
      `${p.cliente_nombre ?? "Alguien"}${p.cliente_email ? ` (${p.cliente_email})` : ""} pagó ${precio(p.total)} por ${p.medio_pago ?? "la web"}.`,
      ...lineasDetalle(p),
      `Entrega: ${p.entrega === "envio" ? `envío a ${p.direccion ?? "(sin dirección)"}` : p.entrega === "retiro" ? "lo retira" : "solo descargables"}.`,
    ],
    `${SITIO_URL}/admin/pedidos`,
  );
}

/* Alguien usó el botón de arrepentimiento. */
export function mailAvisoArrepentimiento(d: DatosArrepentimiento): Mail {
  return mailAviso(
    `Pedido de arrepentimiento ${d.codigo}`,
    [
      `${d.nombre} (${d.email}${d.telefono ? `, ${d.telefono}` : ""}) pide cancelar ${d.pedido ? `el pedido ${d.pedido}` : "una compra"}.`,
      ...(d.motivo ? [`Motivo: ${d.motivo}`] : []),
      "Hay que responderle dentro de las 24 horas.",
    ],
    `${SITIO_URL}/admin/arrepentimientos`,
  );
}

// ---------- La plantilla ----------

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const saludo = (nombre: string | null) => {
  const pila = nombre?.trim().split(/\s+/)[0];
  return pila ? `¡Hola, ${pila}!` : "¡Hola!";
};

const textoPlano = (lineas: string[]) => [...lineas, "", "Cualquier cosa, respondé este mail.", "Alas de Ángel Papelería"].join("\n");

/* Los colores de marca/tokens.css. Un mail no puede leer variables CSS: van escritos. */
const C = { bordo: "#7F2350", nube: "#F6E7D4", rosa: "#F4A9CB", rosaSuave: "#FBDCE9", tinta: "#0B5E41", tintaSuave: "#2F6E55", lima: "#B9D53B", renglon: "#E3CDB6" };
// Gmail no carga fuentes externas: si no están, quedan las de reemplazo (parecidas y seguras).
const TITULO = "'Baloo 2', 'Trebuchet MS', Arial, sans-serif";
const TEXTO = "Karla, 'Segoe UI', Arial, sans-serif";
const MANO = "'La Belle Aurore', 'Brush Script MT', cursive";
// La dirección de la tienda en el pie del mail (desde localhost, la publicada).
const PUBLICO = SITIO_URL.startsWith("https://") ? SITIO_URL : "https://www.alasdeangel.com.ar";

const parrafo = (html: string) => `<p style="margin: 0 0 18px; font-family: ${TEXTO}; font-size: 16px; line-height: 1.6; color: ${C.tinta};">${html}</p>`;
const resaltado = (texto: string) => `<span style="background: ${C.lima}; padding: 0 4px;">${escapar(texto)}</span>`;

const pastillas = (contenidos: string[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 8px;">${contenidos
    .map(
      (c) =>
        `<tr><td style="padding: 0 0 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${C.rosaSuave}; border: 2px solid ${C.tinta}; border-radius: 14px;"><tr><td style="padding: 12px 16px; font-family: ${TEXTO}; font-size: 15px; color: ${C.tinta};">${c}</td></tr></table></td></tr>`,
    )
    .join("")}</table>`;

function lineasDetalle(p: PedidoMail) {
  return [
    ...p.pedido_items.map((i) => `• ${i.cantidad} × ${i.nombre} — ${precio(i.precio_unitario * i.cantidad)}`),
    ...(p.descuento > 0 ? [`Descuento${p.cupon ? ` (cupón ${p.cupon})` : ""}: −${precio(p.descuento)}`] : []),
    ...(p.costo_envio > 0 ? [`Envío: ${precio(p.costo_envio)}`] : []),
    `Total: ${precio(p.total)}`,
  ];
}

function detalle(p: PedidoMail) {
  const fila = (izq: string, der: string, fuerte = false) =>
    `<tr><td style="padding: 8px 0; border-bottom: 1.5px dashed ${C.renglon}; font-family: ${TEXTO}; font-size: 15px; color: ${C.tinta};${fuerte ? " font-weight: bold;" : ""}">${izq}</td><td align="right" style="padding: 8px 0 8px 12px; border-bottom: 1.5px dashed ${C.renglon}; font-family: ${TITULO}; font-size: ${fuerte ? 20 : 15}px; font-weight: bold; color: ${C.tinta}; white-space: nowrap;">${der}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 22px;">${[
    ...p.pedido_items.map((i) => fila(`${i.cantidad} × ${escapar(i.nombre)}`, precio(i.precio_unitario * i.cantidad))),
    ...(p.descuento > 0 ? [fila(`Descuento${p.cupon ? ` (${escapar(p.cupon)})` : ""}`, `−${precio(p.descuento)}`)] : []),
    ...(p.costo_envio > 0 ? [fila("Envío", precio(p.costo_envio))] : []),
    fila("Total", precio(p.total), true),
  ].join("")}</table>`;
}

function plantilla({ nota, titulo, bloques, boton }: { nota: string; titulo: string; bloques: string[]; boton?: { texto: string; url: string } }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700&family=Karla:wght@400;700&family=La+Belle+Aurore&display=swap" rel="stylesheet">
<title>${escapar(titulo)}</title>
</head>
<body style="margin: 0; padding: 0; background: ${C.nube};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${C.nube};">
<tr><td align="center" style="padding: 24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; border-collapse: separate; background: #FFFBF5; border: 2px solid ${C.tinta}; border-radius: 24px; box-shadow: 6px 6px 0 ${C.tinta}; overflow: hidden;">
    <tr><td style="padding: 0; background: ${C.bordo}; border-bottom: 2px solid ${C.tinta}; border-radius: 22px 22px 0 0;">
      <img src="cid:${CABECERA_CID}" width="560" alt="Alas de Ángel Papelería" style="display: block; width: 100%; height: auto; border: 0; border-radius: 22px 22px 0 0;">
    </td></tr>
    <tr><td style="padding: 32px 28px 28px;">
      <div style="font-family: ${MANO}; font-size: 20px; color: ${C.bordo}; margin-bottom: 4px;">${escapar(nota)}</div>
      <h1 style="margin: 0 0 14px; font-family: ${TITULO}; font-size: 28px; line-height: 1.15; color: ${C.tinta};">${escapar(titulo)}</h1>
      ${bloques.join("\n      ")}
      ${
        boton
          ? // De contorno y sin fondo: Gmail en modo oscuro aclara el texto y el borde juntos, y se sigue leyendo.
            `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;"><tr>
        <td style="border: 2px solid ${C.tinta}; border-radius: 999px;">
          <a href="${escapar(boton.url)}" style="display: inline-block; padding: 11px 24px; font-family: ${TEXTO}; font-size: 16px; font-weight: bold; color: ${C.tinta}; text-decoration: none;">${escapar(boton.texto)} &rarr;</a>
        </td>
      </tr></table>`
          : ""
      }
      <p style="margin: 0; padding-top: 18px; border-top: 1.5px dashed ${C.renglon}; font-family: ${TEXTO}; font-size: 14px; line-height: 1.6; color: ${C.tintaSuave};">
        ¿Alguna duda? Respondé este mail y te contestamos.<br>
        <span style="font-family: ${MANO}; font-size: 19px; color: ${C.bordo};">con cariño, Alas de Ángel</span>
      </p>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
    <tr><td align="center" style="padding: 22px 12px 0; font-family: ${TEXTO}; font-size: 13px; color: ${C.tintaSuave};">
      <a href="${PUBLICO}" style="color: ${C.tintaSuave};">alasdeangel.com.ar</a> &nbsp;·&nbsp; <a href="${enlaceInstagram}" style="color: ${C.tintaSuave};">@${escapar(CONTACTO.instagram)}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
