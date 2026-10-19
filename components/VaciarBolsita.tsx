"use client";

import { useEffect } from "react";
import { vaciar } from "@/lib/bolsita";

/* Al volver de Mercado Pago con el pago hecho, la bolsita se vacía. */
export function VaciarBolsita() {
  useEffect(() => vaciar(), []);
  return null;
}
