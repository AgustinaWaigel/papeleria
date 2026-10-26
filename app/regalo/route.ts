import { BUCKET_DESCARGABLES, supabaseConfigurado } from "@/lib/supabase/config";
import { clienteServicio, SUPABASE_SECRETA } from "@/lib/supabase/servidor";

/* El botón del mail de regalo por suscribirse. Con el mail y la clave del suscriptor, lleva a un link del PDF que
   dura un minuto (como app/(tienda)/pedido/[codigo]/pdf/[producto]/route.ts). Es siempre el regalo de ahora: si
   cambia en el panel, el botón baja el nuevo. Si algo no cierra, va a los descargables. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("mail") ?? "").toLowerCase();
  const clave = url.searchParams.get("clave") ?? "";
  const aDescargables = () => Response.redirect(new URL("/descargables", url), 302);
  if (!supabaseConfigurado || !SUPABASE_SECRETA || !email || !/^[0-9a-f]{32}$/.test(clave)) return aDescargables();

  const supabase = clienteServicio();
  const [{ data: suscriptor }, { data: ajustes }] = await Promise.all([
    supabase.from("suscriptores").select("email").eq("email", email).eq("clave", clave).maybeSingle(),
    supabase.from("ajustes").select("regalo_producto").maybeSingle(),
  ]);
  if (!suscriptor || !ajustes?.regalo_producto) return aDescargables();

  const { data: producto } = await supabase.from("productos").select("nombre, archivo").eq("id", ajustes.regalo_producto).maybeSingle();
  if (!producto?.archivo) return aDescargables();
  const extension = producto.archivo.split(".").pop() ?? "pdf";
  const { data: firmado } = await supabase.storage
    .from(BUCKET_DESCARGABLES)
    .createSignedUrl(producto.archivo, 60, { download: `${producto.nombre} - Alas de Angel.${extension}` });
  if (!firmado) return aDescargables();
  return Response.redirect(firmado.signedUrl, 302);
}
