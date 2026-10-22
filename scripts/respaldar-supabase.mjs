/* Copia todas las tablas y los archivos del proyecto de Supabase de .env.local a la carpeta respaldo-supabase/.
   Uso: node --env-file=.env.local scripts/respaldar-supabase.mjs */

import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.SUPABASE_SECRET_KEY;
if (!URL || !CLAVE) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");

const TABLAS = [
  "admins", "categorias", "productos", "ajustes", "zonas_envio", "cupones", "pedidos", "pedido_items",
  "resenas", "suscriptores", "arrepentimientos", "avisos_stock",
];
const BUCKETS = ["productos", "descargables"];
const CARPETA = "respaldo-supabase";

const supabase = createClient(URL, CLAVE, { auth: { persistSession: false } });

async function leerTabla(tabla) {
  const filas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.from(tabla).select("*").range(desde, desde + 999);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    filas.push(...data);
    if (data.length < 1000) return filas;
  }
}

async function listarArchivos(bucket, prefijo = "") {
  const rutas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefijo, { limit: 1000, offset: desde });
    if (error) throw new Error(`${bucket}/${prefijo}: ${error.message}`);
    for (const item of data) {
      const ruta = prefijo ? `${prefijo}/${item.name}` : item.name;
      // Las carpetas vienen sin id.
      if (item.id) rutas.push(ruta);
      else rutas.push(...(await listarArchivos(bucket, ruta)));
    }
    if (data.length < 1000) return rutas;
  }
}

await mkdir(path.join(CARPETA, "datos"), { recursive: true });
await writeFile(path.join(CARPETA, "origen.json"), JSON.stringify({ url: URL, fecha: new Date().toISOString() }, null, 2));

for (const tabla of TABLAS) {
  const filas = await leerTabla(tabla);
  await writeFile(path.join(CARPETA, "datos", `${tabla}.json`), JSON.stringify(filas, null, 2));
  console.log(`${tabla}: ${filas.length} filas`);
}

for (const bucket of BUCKETS) {
  const rutas = await listarArchivos(bucket);
  for (const ruta of rutas) {
    const { data, error } = await supabase.storage.from(bucket).download(ruta);
    if (error) throw new Error(`${bucket}/${ruta}: ${error.message}`);
    const destino = path.join(CARPETA, "archivos", bucket, ruta);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, Buffer.from(await data.arrayBuffer()));
  }
  console.log(`bucket ${bucket}: ${rutas.length} archivos`);
}

console.log(`\nListo. Todo quedó en ${CARPETA}/`);
