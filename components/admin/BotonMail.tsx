"use client";

import { useActionState } from "react";
import { mandarMail, type TipoMail } from "@/app/admin/pedidos/acciones";

/* Manda (o reenvía) uno de los mails al cliente: la confirmación, el aviso de envío o los PDF. */
export function BotonMail({ id, tipo, texto }: { id: number; tipo: TipoMail; texto: string }) {
  const [estado, accion, enviando] = useActionState(mandarMail, undefined);

  return (
    <form action={accion}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="tipo" value={tipo} />
      <button className="admin__borrar" type="submit" disabled={enviando}>
        {enviando ? "Mandando…" : texto}
      </button>
      {estado?.error && (
        <p className="admin__error mt-e4" role="alert">
          {estado.error}
        </p>
      )}
      {estado?.ok && (
        <p className="admin__exito mt-e4" role="status">
          {estado.ok}
        </p>
      )}
    </form>
  );
}
