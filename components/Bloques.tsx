import type { ReactNode } from "react";

/* Bloques de página que se repiten: portadilla, sección con encabezado y franja de cierre. */

/* chica: en las páginas de catálogo, para que los productos se vean sin bajar. */
export function Portadilla({ nota, titulo, chica, children }: { nota: string; titulo: string; chica?: boolean; children: ReactNode }) {
  return (
    <section className={chica ? "portadilla portadilla--chica" : "portadilla"}>
      <div className="contenedor">
        <span className="nota-mano">{nota}</span>
        <h1>{titulo}</h1>
        <p>{children}</p>
      </div>
    </section>
  );
}

type SeccionProps = {
  nota?: string;
  titulo?: string;
  bajada?: ReactNode;
  accion?: ReactNode;
  cielo?: boolean;
  children?: ReactNode;
};

export function Seccion({ nota, titulo, bajada, accion, cielo, children }: SeccionProps) {
  return (
    <section className={`seccion${cielo ? " seccion--cielo" : ""}`}>
      <div className="contenedor">
        {titulo && (
          <div className={`encabezado-seccion${children ? "" : " mb-0"}`}>
            <div>
              {nota && <span className="nota-mano">{nota}</span>}
              <h2>{titulo}</h2>
              {bajada && <p>{bajada}</p>}
            </div>
            {accion}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function Franja({ titulo, children, accion }: { titulo: string; children: ReactNode; accion: ReactNode }) {
  return (
    <div className="franja">
      <div>
        <h2>{titulo}</h2>
        <p>{children}</p>
      </div>
      {accion}
    </div>
  );
}
