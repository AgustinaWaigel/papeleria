"use server";

import { randomInt } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";
import { TAGS } from "@/lib/catalogo";
import { ESTADOS } from "@/lib/pedidos";
import type { Estado } from "../acciones";

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "").trim();
const estadoValido = (valor: string) => ESTADOS.some(([e]) => e === valor);

/* Las ventas cargadas a mano llevan V- y las de la web AA-, así se distinguen de un vistazo. */
function codigoVenta() {
  const letras = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return "V-" + Array.from({ length: 5 }, () => letras[randomInt(letras.length)]).join("");
}

type ItemVenta = { id: string | null; nombre: string; precio: number; cantidad: number };

export async function registrarVenta(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();

  let items: ItemVenta[];
  try {
    items = JSON.parse(texto(datos, "items"));
  } catch {
    return { error: "No se entendió la lista de productos. Recargá la página y probá de nuevo." };
  }
  items = items.filter((i) => i.cantidad > 0 && (i.id || i.nombre.trim()));
  if (items.length === 0) return { error: "Sumá al menos un producto a la venta." };
  if (items.some((i) => !Number.isFinite(i.precio) || i.precio < 0)) return { error: "Revisá los precios: hay uno vacío o negativo." };

  const estado = texto(datos, "estado");
  if (!estadoValido(estado)) return { error: "Elegí el estado de la venta." };

  const codigo = codigoVenta();
  const { error } = await supabase.rpc("registrar_venta", {
    p_codigo: codigo,
    p_items: items,
    p_estado: estado,
    p_fecha: texto(datos, "fecha") || null,
    p_nombre: texto(datos, "cliente_nombre"),
    p_contacto: texto(datos, "cliente_contacto"),
    p_medio_pago: texto(datos, "medio_pago"),
    p_notas: texto(datos, "notas"),
  });
  if (error) return { error: `No se pudo guardar la venta: ${error.message}` };

  updateTag(TAGS.catalogo); // puede haber cambiado el stock
  redirect(`/admin/pedidos?listo=${codigo}`);
}

export async function cambiarEstado(datos: FormData) {
  const { supabase } = await exigirAdmin();
  const estado = texto(datos, "estado");
  if (!estadoValido(estado)) return;

  await supabase.rpc("cambiar_estado_pedido", { p_pedido: Number(texto(datos, "id")), p_estado: estado });
  updateTag(TAGS.catalogo);
  refresh();
}

export async function guardarDatosPedido(_: Estado, datos: FormData): Promise<Estado> {
  const { supabase } = await exigirAdmin();
  const vacioANull = (campo: string) => texto(datos, campo) || null;

  const { error } = await supabase
    .from("pedidos")
    .update({
      cliente_nombre: vacioANull("cliente_nombre"),
      cliente_contacto: vacioANull("cliente_contacto"),
      medio_pago: vacioANull("medio_pago"),
      notas: vacioANull("notas"),
      ...(texto(datos, "fecha") && { fecha: texto(datos, "fecha") }),
    })
    .eq("id", Number(texto(datos, "id")));
  if (error) return { error: `No se pudo guardar: ${error.message}` };
  refresh();
  return { ok: "Guardado." };
}

export async function borrarPedido(datos: FormData) {
  const { supabase } = await exigirAdmin();
  await supabase.rpc("borrar_pedido", { p_pedido: Number(texto(datos, "id")) });
  updateTag(TAGS.catalogo);
  redirect("/admin/pedidos");
}
