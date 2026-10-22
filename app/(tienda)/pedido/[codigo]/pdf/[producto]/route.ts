import { CONFIRMADOS, type EstadoPedido } from "@/lib/pedidos";
import { BUCKET_DESCARGABLES, supabaseConfigurado } from "@/lib/supabase/config";
import { clienteServicio, SUPABASE_SECRETA } from "@/lib/supabase/servidor";

/* El botón "Descargar PDF" del mail y del seguimiento. Con el código y la clave del pedido, y solo si está pagado
   y lleva ese descargable, lleva a un link del PDF que dura un minuto: así el botón del mail no vence nunca.
   Si algo no cierra, vuelve al seguimiento del pedido (que avisa si no lo encuentra). */
export async function GET(request: Request, ctx: RouteContext<"/pedido/[codigo]/pdf/[producto]">) {
  const { codigo, producto } = await ctx.params;
  const url = new URL(request.url);
  const clave = url.searchParams.get("clave") ?? "";
  const alSeguimiento = () => Response.redirect(new URL(`/pedido/${encodeURIComponent(codigo)}?clave=${encodeURIComponent(clave)}`, url), 302);
  if (!supabaseConfigurado || !SUPABASE_SECRETA || !/^[0-9a-f]{32}$/.test(clave)) return alSeguimiento();

  const supabase = clienteServicio();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("estado, pedido_items(producto_id)")
    .eq("codigo", codigo)
    .eq("clave", clave)
    .maybeSingle();
  const lleva = (pedido?.pedido_items as { producto_id: string | null }[] | undefined)?.some((i) => i.producto_id === producto);
  if (!pedido || !CONFIRMADOS.includes(pedido.estado as EstadoPedido) || !lleva) return alSeguimiento();

  const { data: descargable } = await supabase.from("productos").select("nombre, archivo").eq("id", producto).eq("tipo", "descargable").maybeSingle();
  if (!descargable?.archivo) return alSeguimiento();
  const extension = descargable.archivo.split(".").pop() ?? "pdf";
  const { data: firmado } = await supabase.storage
    .from(BUCKET_DESCARGABLES)
    .createSignedUrl(descargable.archivo, 60, { download: `${descargable.nombre} - Alas de Angel.${extension}` });
  if (!firmado) return alSeguimiento();
  return Response.redirect(firmado.signedUrl, 302);
}
