/* Corre la tienda con otro rubro sin tocar .env.local:
     node scripts/rubro.mjs gastronomia            → next dev
     node scripts/rubro.mjs gastronomia build      → next build
   Lista los rubros disponibles si no le pasás ninguno. Funciona igual en Windows, Mac y Linux. */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

const [rubro, comando = "dev", ...resto] = process.argv.slice(2);
const disponibles = readdirSync("rubros").filter((f) => f.endsWith(".env")).map((f) => f.slice(0, -4));

if (!rubro || !existsSync(`rubros/${rubro}.env`)) {
  console.log(`Rubros disponibles: ${disponibles.join(", ")}\nUso: node scripts/rubro.mjs <rubro> [dev|build|start]`);
  process.exit(rubro ? 1 : 0);
}

console.log(`▶ Rubro: ${rubro} (rubros/${rubro}.env)`);
const hijo = spawn("npx", ["next", comando, ...resto], { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, RUBRO: rubro } });
hijo.on("exit", (codigo) => process.exit(codigo ?? 0));
