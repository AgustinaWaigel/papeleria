import type { NextConfig } from "next";

// Las fotos subidas desde el panel se sirven desde Supabase Storage.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

const nextConfig: NextConfig = {
  /* config options here */
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
