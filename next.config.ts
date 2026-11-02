import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import path from "node:path";

// Las fotos subidas desde el panel se sirven desde Supabase Storage.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

/* ── Multirubro ──
   RUBRO elige el archivo rubros/<rubro>.env (por defecto, papeleria). Cada variable de ese archivo
   se puede pisar una por una desde .env.local o desde Vercel. El resultado va en `env`: así llega
   tanto al servidor como al navegador, sin el prefijo NEXT_PUBLIC_. */
const RUBRO = (process.env.RUBRO || "papeleria").trim();

function leerRubro(nombre: string): Record<string, string> {
  const archivo = path.join(process.cwd(), "rubros", `${nombre}.env`);
  let texto: string;
  try {
    texto = readFileSync(archivo, "utf8");
  } catch {
    throw new Error(`RUBRO="${nombre}": no existe rubros/${nombre}.env`);
  }
  const valores: Record<string, string> = {};
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let valor = m[2];
    const comillas = valor.match(/^(["'])(.*)\1$/);
    valor = comillas ? comillas[2] : valor.replace(/\s+#.*$/, "");
    valores[m[1]] = valor;
  }
  return valores;
}

const base = { ...leerRubro("papeleria"), ...(RUBRO === "papeleria" ? {} : leerRubro(RUBRO)) };
const marca: Record<string, string> = { RUBRO };
for (const clave of Object.keys(base)) marca[clave] = process.env[clave] ?? base[clave];

// La página de productos físicos vive en app/(tienda)/papeleria; con otro CATALOGO_RUTA se la sirve en esa dirección.
const rutaCatalogo = (marca.CATALOGO_RUTA || "papeleria").replace(/^\/+|\/+$/g, "");

const nextConfig: NextConfig = {
  env: marca,
  async rewrites() {
    return rutaCatalogo === "papeleria" ? [] : [{ source: `/${rutaCatalogo}`, destination: "/papeleria" }];
  },
  async redirects() {
    return rutaCatalogo === "papeleria" ? [] : [{ source: "/papeleria", destination: `/${rutaCatalogo}`, permanent: false }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabase
      ? [{ protocol: "https", hostname: supabase.hostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async headers() {
    return [
      {
        // En todo el sitio: nadie puede meterlo adentro de otra página (para engañar clics), el navegador
        // no adivina tipos de archivo, y a otros sitios solo les llega el dominio, nunca la dirección
        // completa (así el link privado de un pedido no viaja a WhatsApp o Instagram al tocar un enlace).
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // El panel, los pedidos y los avisos de pago no van a Google (además de robots.txt).
        source: "/:seccion(admin|pedido|api)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  experimental: {
    // Las fotos llegan al panel por una acción de servidor: el límite por defecto (1 MB) queda corto.
    // 10 MB es también lo que proxy.ts deja pasar (proxyClientMaxBodySize).
    serverActions: { bodySizeLimit: "10mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
