/* Carga en el proyecto de Supabase de .env.local lo que guardó respaldar-supabase.mjs.
   Sube los archivos a los buckets y arma respaldo-supabase/restaurar.sql con los datos,
   para pegar en SQL Editor (hace falta SQL para conservar los id de pedidos, zonas, etc.).
   Uso: node --env-file=.env.local scripts/restaurar-supabase.mjs */

import { createClient } from "@supabase/supabase-js";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.SUPABASE_SECRET_KEY;
if (!URL || !CLAVE) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");

const CARPETA = "respaldo-supabase";
const origen = JSON.parse(await readFile(path.join(CARPETA, "origen.json"), "utf8"));
if (origen.url === URL) throw new Error(".env.local todavía apunta al proyecto viejo. Poné los datos del nuevo.");

// En el orden en que se cargan: primero las tablas a las que apuntan las demás.
const TABLAS = [
  "admins", "categorias", "productos", "ajustes", "zonas_envio", "cupones", "pedidos", "pedido_items",
  "resenas", "suscriptores", "arrepentimientos", "avisos_stock",
];
const CON_IDENTITY = ["pedidos", "pedido_items", "zonas_envio", "resenas", "arrepentimientos", "avisos_stock"];

// Sin el tipo, Storage los guarda como texto y los buckets los rechazan.
const TIPOS = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
  ".avif": "image/avif", ".pdf": "application/pdf", ".zip": "application/zip",
};

const supabase = createClient(URL, CLAVE, { auth: { persistSession: false } });

async function listarLocal(carpeta) {
  const entradas = await readdir(carpeta, { withFileTypes: true, recursive: true });
  return entradas.filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name));
}

for (const bucket of ["productos", "descargables"]) {
  const base = path.join(CARPETA, "archivos", bucket);
  const archivos = await listarLocal(base).catch(() => []);
  for (const archivo of archivos) {
    const ruta = path.relative(base, archivo).split(path.sep).join("/");
    const contenido = await readFile(archivo);
    const tipo = TIPOS[path.extname(ruta).toLowerCase()];
    const { error } = await supabase.storage.from(bucket).upload(ruta, contenido, { upsert: true, contentType: tipo });
    if (error) throw new Error(`${bucket}/${ruta}: ${error.message}. ¿Corriste todos los .sql de supabase/?`);
  }
  console.log(`bucket ${bucket}: ${archivos.length} archivos subidos`);
}

const sql = ["begin;", ""];
// Los scripts de supabase/ cargan categorías, ajustes y zonas por defecto: se reemplazan por las del respaldo.
for (const tabla of [...TABLAS].reverse()) sql.push(`delete from public.${tabla};`);
sql.push("");

for (const tabla of TABLAS) {
  // Las fotos guardan la URL completa del proyecto, así que se cambia por la del nuevo.
  const texto = (await readFile(path.join(CARPETA, "datos", `${tabla}.json`), "utf8")).replaceAll(origen.url, URL);
  if (JSON.parse(texto).length === 0) continue;
  const override = CON_IDENTITY.includes(tabla) ? " overriding system value" : "";
  sql.push(
    `insert into public.${tabla}${override}`,
    `select * from jsonb_populate_recordset(null::public.${tabla}, $respaldo$${texto}$respaldo$::jsonb);`,
    "",
  );
}

for (const tabla of CON_IDENTITY) {
  sql.push(
    `select setval(pg_get_serial_sequence('public.${tabla}', 'id'), coalesce(max(id), 1), max(id) is not null) from public.${tabla};`,
  );
}
sql.push("", "commit;");

await writeFile(path.join(CARPETA, "restaurar.sql"), sql.join("\n"));
console.log(`\nArchivos listos. Ahora pegá ${CARPETA}/restaurar.sql en SQL Editor y tocá Run.`);
