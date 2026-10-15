import { ProveedorBolsita } from "@/components/Bolsita";
import { Cabecera } from "@/components/Cabecera";
import { Pie } from "@/components/Pie";
import { obtenerCatalogo } from "@/lib/catalogo";

export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  // La bolsita vive en el navegador: le pasamos solo lo que necesita para mostrar y sumar.
  const resumen = (await obtenerCatalogo()).map(({ id, nombre, precio, stock }) => ({ id, nombre, precio, stock }));

  return (
    <>
      <a className="saltar" href="#contenido">
        Ir al contenido
      </a>
      <ProveedorBolsita catalogo={resumen}>
        <Cabecera />
        <main id="contenido">{children}</main>
        <Pie />
      </ProveedorBolsita>
    </>
  );
}
