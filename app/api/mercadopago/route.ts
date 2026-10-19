import { leerPago, pagoOnlineConfigurado, registrarPago } from "@/lib/mercadopago";

/* Acá avisa Mercado Pago cuando un pago cambia (aprobado, rechazado, devuelto…).
   El aviso solo trae el número de pago: el pago en sí se consulta a la API con nuestro token, así que
   un aviso falso no puede marcar nada como pagado. */
export async function POST(request: Request) {
  if (!pagoOnlineConfigurado) return new Response(null, { status: 200 });

  const url = new URL(request.url);
  const cuerpo = (await request.json().catch(() => ({}))) as { type?: string; topic?: string; data?: { id?: string | number } };
  const tipo = cuerpo.type ?? cuerpo.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const id = String(cuerpo.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  // Otros avisos (órdenes, contracargos…) no hacen falta: se responde OK para que no los reintente.
  if (tipo !== "payment" || !/^\d+$/.test(id)) return new Response(null, { status: 200 });

  try {
    await registrarPago(await leerPago(id));
    return new Response(null, { status: 200 });
  } catch (e) {
    console.error("Aviso de Mercado Pago sin procesar:", e);
    // Con un error, Mercado Pago lo vuelve a mandar más tarde.
    return new Response(null, { status: 500 });
  }
}
