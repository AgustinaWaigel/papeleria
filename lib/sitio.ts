/* La dirección pública del sitio, para el sitemap, los links que se comparten y Google.
   Va en NEXT_PUBLIC_SITIO_URL (ver .env.example). En Vercel se toma sola del dominio principal. */
export const SITIO_URL = (
  process.env.NEXT_PUBLIC_SITIO_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
