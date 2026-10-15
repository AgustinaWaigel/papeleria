import "server-only";

import ExcelJS from "exceljs";
import type { FilaProducto } from "./catalogo";
import { COLORES, NOMBRES_DIBUJO, TIPOS, type Categorias, type TipoProducto } from "./productos";

/* Los productos en una planilla: se exportan desde el panel y se vuelven a cargar con los cambios.
   Las listas (fotos, características, contenido de un pack) van una por renglón dentro de la celda;
   los párrafos de la descripción, separados por un renglón en blanco. */

export const HOJA = "Productos";

const COLUMNAS = [
  { clave: "id", titulo: "Identificador", ancho: 24 },
  { clave: "nombre", titulo: "Nombre", ancho: 32 },
  { clave: "tipo", titulo: "Sección", ancho: 14 },
  { clave: "cat", titulo: "Categoría", ancho: 22 },
  { clave: "precio", titulo: "Precio", ancho: 11 },
  { clave: "precio_anterior", titulo: "Precio anterior", ancho: 15 },
  { clave: "stock", titulo: "Stock", ancho: 9 },
  { clave: "resumen", titulo: "Resumen", ancho: 50 },
  { clave: "detalle", titulo: "Detalle", ancho: 26 },
  { clave: "descripcion", titulo: "Descripción", ancho: 60 },
  { clave: "caracteristicas", titulo: "Características", ancho: 40 },
  { clave: "contenido", titulo: "Contenido del pack", ancho: 36 },
  { clave: "fotos", titulo: "Fotos", ancho: 40 },
  { clave: "dibujo", titulo: "Dibujo", ancho: 16 },
  { clave: "color", titulo: "Color", ancho: 12 },
  { clave: "destacado", titulo: "En Inicio", ancho: 10 },
  { clave: "activo", titulo: "En la tienda", ancho: 12 },
  { clave: "orden", titulo: "Orden", ancho: 8 },
] as const;

type Clave = (typeof COLUMNAS)[number]["clave"];

const siNo = (valor: boolean) => (valor ? "sí" : "no");
const nombreDe = (lista: readonly (readonly [string, string])[], id: string | null) => lista.find(([i]) => i === id)?.[1] ?? id ?? "";

export async function armarExcel(filas: FilaProducto[], categorias: Categorias) {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Alas de Ángel Papelería";

  const hoja = libro.addWorksheet(HOJA, { views: [{ state: "frozen", ySplit: 1, xSplit: 2 }] });
  hoja.columns = COLUMNAS.map((c) => ({ header: c.titulo, key: c.clave, width: c.ancho }));
  hoja.getRow(1).font = { bold: true };
  hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4A9CB" } };

  for (const f of filas) {
    hoja.addRow({
      id: f.id,
      nombre: f.nombre,
      tipo: nombreDe(TIPOS, f.tipo),
      cat: f.cat ? nombreDe(categorias[f.tipo] ?? [], f.cat) : "",
      precio: f.precio,
      precio_anterior: f.precio_anterior ?? "",
      stock: f.stock ?? "",
      resumen: f.resumen,
      detalle: f.detalle ?? "",
      descripcion: (f.descripcion ?? []).join("\n\n"),
      caracteristicas: (f.caracteristicas ?? []).join("\n"),
      contenido: (f.contenido ?? []).join("\n"),
      fotos: (f.fotos ?? []).join("\n"),
      dibujo: f.dibujo,
      color: nombreDe(COLORES, f.color),
      destacado: siNo(f.destacado),
      activo: siNo(f.activo),
      orden: f.orden,
    } satisfies Record<Clave, string | number>);
  }
  hoja.eachRow((fila, n) => {
    if (n > 1) fila.alignment = { vertical: "top", wrapText: true };
  });

  // Una segunda hoja con lo que acepta cada columna, para no tener que adivinar.
  const ayuda = libro.addWorksheet("Cómo completar");
  ayuda.columns = [{ width: 22 }, { width: 90 }];
  const renglones: [string, string][] = [
    ["Columna", "Qué va"],
    ["Identificador", "Opcional. En minúsculas, sin espacios ni tildes (cuaderno-pluma). Si lo dejás vacío se arma con el nombre. Si ya existe, el producto se actualiza."],
    ["Nombre", "Obligatorio."],
    ["Sección", `Obligatorio. Una de: ${TIPOS.map(([, n]) => n).join(", ")}.`],
    ...(Object.entries(categorias) as [TipoProducto, [string, string][]][]).map(
      ([tipo, lista]): [string, string] => [`Categoría (${nombreDe(TIPOS, tipo)})`, lista.map(([, n]) => n).join(", ")],
    ),
    ["Precio", "Obligatorio. En pesos, sin signo ni puntos (9800)."],
    ["Precio anterior", "Opcional. Si es mayor que el precio, el producto aparece en oferta."],
    ["Stock", "Opcional. Vacío = no se controla."],
    ["Resumen", "Una o dos frases para la ficha del catálogo."],
    ["Detalle", "Datos cortos (A5 · 80 hojas · rayado)."],
    ["Descripción", "Texto largo. Separá los párrafos con un renglón en blanco (Alt + Enter dos veces)."],
    ["Características", "Una por renglón (Alt + Enter)."],
    ["Contenido del pack", "Solo para packs: un ítem por renglón."],
    ["Fotos", "Direcciones de las fotos, una por renglón. Las fotos nuevas conviene subirlas desde el panel."],
    ["Dibujo", `Se muestra cuando no hay foto. Uno de: ${NOMBRES_DIBUJO.join(", ")}.`],
    ["Color", `Uno de: ${COLORES.map(([, n]) => n).join(", ")}.`],
    ["En Inicio / En la tienda", "sí o no. En la tienda vacío = sí."],
    ["Orden", "Número: los más chicos aparecen primero."],
  ];
  renglones.forEach((r) => ayuda.addRow(r));
  ayuda.getRow(1).font = { bold: true };
  ayuda.eachRow((fila) => (fila.alignment = { vertical: "top", wrapText: true }));

  return Buffer.from(await libro.xlsx.writeBuffer());
}

// ---------- Importar ----------

const sinTildes = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/* "Cuaderno Pluma A5" → "cuaderno-pluma-a5" */
const aIdentificador = (texto: string) =>
  sinTildes(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* Acepta el identificador interno o el nombre que se ve ("fisico" o "Papelería"). */
const buscar = <T extends string>(lista: readonly (readonly [T, string])[], valor: string) =>
  lista.find(([id, nombre]) => sinTildes(id) === sinTildes(valor) || sinTildes(nombre) === sinTildes(valor))?.[0];

const renglones = (valor: string) =>
  valor
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);
const parrafos = (valor: string) =>
  valor
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\s*\r?\n\s*/g, " ").trim())
    .filter(Boolean);
const oNull = <T,>(lista: T[]) => (lista.length > 0 ? lista : null);

const DIBUJO_POR_TIPO = { fisico: "cuaderno", descargable: "hoja-semana", pack: "pack" } as const;

function texto(celda: ExcelJS.Cell) {
  const v = celda.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "richText" in v) return v.richText.map((t) => t.text).join("").trim();
  if (typeof v === "object" && "result" in v) return String(v.result ?? "").trim(); // fórmula
  return celda.text.trim();
}

/* Pesos enteros: 9800, "9.800", "$ 9.800,50" → 9800. Vacío → null. */
function pesos(celda: ExcelJS.Cell) {
  const v = celda.value;
  const crudo = typeof v === "object" && v && "result" in v ? v.result : v;
  if (typeof crudo === "number") return Math.round(crudo);
  const t = texto(celda).split(",")[0].replace(/\D/g, "");
  return t ? Number(t) : null;
}

function siONo(valor: string, siVacio: boolean) {
  const v = sinTildes(valor);
  if (!v) return siVacio;
  return ["si", "s", "x", "1", "true", "verdadero"].includes(v);
}

export type FilaImportada = Omit<FilaProducto, "orden"> & { orden: number };

/* existentes: los productos que ya están en la base. Si a la planilla le falta una columna,
   esos productos conservan lo que tenían en vez de quedar vacíos. */
export async function leerExcel(archivo: ArrayBuffer, categorias: Categorias, existentes: Map<string, FilaProducto>) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(archivo);
  const hoja = libro.getWorksheet(HOJA) ?? libro.worksheets[0];
  if (!hoja) return { filas: [], errores: ["El archivo no tiene ninguna hoja."] };

  // Las columnas se buscan por título, así no importa el orden ni si sobran columnas.
  const posicion = new Map<Clave, number>();
  hoja.getRow(1).eachCell((celda, n) => {
    const columna = COLUMNAS.find((c) => sinTildes(c.titulo) === sinTildes(texto(celda)) || c.clave === sinTildes(texto(celda)));
    if (columna) posicion.set(columna.clave, n);
  });
  const faltan = (["nombre", "tipo", "precio"] as const).filter((c) => !posicion.has(c));
  if (faltan.length > 0) {
    const titulos = faltan.map((c) => COLUMNAS.find((col) => col.clave === c)!.titulo);
    return { filas: [], errores: [`Faltan las columnas: ${titulos.join(", ")}. Descargá el Excel del panel y usalo de base.`] };
  }

  const filas: FilaImportada[] = [];
  const errores: string[] = [];
  const vistos = new Set<string>();

  hoja.eachRow((fila, n) => {
    if (n === 1) return;
    const celda = (clave: Clave) => fila.getCell(posicion.get(clave) ?? 10_000);
    const t = (clave: Clave) => (posicion.has(clave) ? texto(celda(clave)) : "");
    const p = (clave: Clave) => (posicion.has(clave) ? pesos(celda(clave)) : null);

    const nombre = t("nombre");
    if (!nombre && !t("tipo") && p("precio") === null) return; // renglón vacío
    const error = (motivo: string) => errores.push(`Fila ${n}${nombre ? ` (${nombre})` : ""}: ${motivo}`);

    if (!nombre) return error("falta el nombre.");
    const tipo = buscar(TIPOS, t("tipo"));
    if (!tipo) return error(`la sección "${t("tipo")}" no existe. Usá ${TIPOS.map(([, nom]) => nom).join(", ")}.`);
    const precio = p("precio");
    if (precio === null) return error("falta el precio.");

    const id = t("id") ? sinTildes(t("id")) : aIdentificador(nombre);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) return error(`el identificador "${t("id")}" va en minúsculas, sin espacios ni tildes.`);
    if (vistos.has(id)) return error(`el identificador "${id}" está repetido en la planilla.`);
    vistos.add(id);

    const deEseTipo = categorias[tipo] ?? [];
    let cat: string | null = null;
    if (deEseTipo.length > 0 && t("cat")) {
      cat = buscar(deEseTipo, t("cat")) ?? null;
      if (!cat) return error(`la categoría "${t("cat")}" no existe en ${nombreDe(TIPOS, tipo)}. Creala primero en Categorías.`);
    }

    const dibujo = t("dibujo") ? NOMBRES_DIBUJO.find((d) => d === sinTildes(t("dibujo"))) : DIBUJO_POR_TIPO[tipo];
    if (!dibujo) return error(`el dibujo "${t("dibujo")}" no existe.`);
    const color = t("color") ? buscar(COLORES, t("color")) : "lavanda";
    if (!color) return error(`el color "${t("color")}" no existe. Usá ${COLORES.map(([, nom]) => nom).join(", ")}.`);

    const nueva: FilaImportada = {
      id,
      tipo,
      cat,
      nombre,
      resumen: t("resumen"),
      detalle: t("detalle") || null,
      precio,
      precio_anterior: p("precio_anterior"),
      stock: p("stock"),
      dibujo,
      color,
      destacado: siONo(t("destacado"), false),
      activo: siONo(t("activo"), true),
      orden: p("orden") ?? 0,
      contenido: tipo === "pack" ? oNull(renglones(t("contenido"))) : null,
      descripcion: oNull(parrafos(t("descripcion"))),
      caracteristicas: oNull(renglones(t("caracteristicas"))),
      fotos: oNull(renglones(t("fotos"))),
    };
    const antes = existentes.get(id);
    if (antes) {
      for (const { clave } of COLUMNAS) {
        if (clave !== "id" && !posicion.has(clave)) Object.assign(nueva, { [clave]: antes[clave] ?? null });
      }
    }
    filas.push(nueva);
  });

  if (filas.length === 0 && errores.length === 0) errores.push("La planilla no tiene productos.");
  return { filas, errores };
}
