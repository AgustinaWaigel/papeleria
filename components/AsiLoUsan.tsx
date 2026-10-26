import Image from "next/image";
import Link from "next/link";
import type { FotoClienta } from "@/lib/catalogo";
import { rutaProducto } from "@/lib/productos";

/* "Así lo usan": fotos de clientas, cada una con quién la sacó y, en Inicio, el producto que se ve. */
export function AsiLoUsan({ fotos, conProducto }: { fotos: FotoClienta[]; conProducto?: Map<string, string> }) {
  return (
    <ul className="asi-lo-usan">
      {fotos.map((f) => {
        const producto = f.producto_id ? conProducto?.get(f.producto_id) : undefined;
        return (
          <li key={f.id}>
            <figure>
              <div className="asi-lo-usan__foto">
                <Image src={f.foto} alt={producto ? `${producto}, foto de una clienta` : "Foto de una clienta"} fill sizes="(min-width: 52rem) 18rem, 50vw" />
              </div>
              {(f.autora || producto) && (
                <figcaption>
                  {f.autora && <span className="nota-mano">{f.autora}</span>}
                  {producto && f.producto_id && <Link href={rutaProducto(f.producto_id)}>{producto}</Link>}
                </figcaption>
              )}
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
