/* Datos del proyecto de Supabase. Van en .env.local (ver .env.example).
   Si faltan, la tienda muestra el catálogo de lib/productos.tsx y el panel explica cómo conectarlo. */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_CLAVE =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_CLAVE);

/* Bucket de Storage donde se guardan las fotos de producto. */
export const BUCKET_FOTOS = "productos";
