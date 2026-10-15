import { precio as formato } from "@/lib/contacto";
import { enOferta, type Producto } from "@/lib/productos";

/* El precio, con el anterior tachado si el producto está en oferta. */
export function Precio({ producto: p, className }: { producto: Pick<Producto, "precio" | "precioAnterior">; className: string }) {
  if (!enOferta(p)) return <span className={className}>{formato(p.precio)}</span>;
  return (
    <span className={`${className} precio--oferta`}>
      <del>
        <span className="sr-only">Antes </span>
        {formato(p.precioAnterior!)}
      </del>{" "}
      <ins>
        <span className="sr-only">Ahora </span>
        {formato(p.precio)}
      </ins>
    </span>
  );
}
