import { ProveedorBolsita } from "@/components/Bolsita";
import { Cabecera } from "@/components/Cabecera";
import { Pie } from "@/components/Pie";
import { obtenerAjustesEnvio, obtenerCatalogo, obtenerSecciones } from "@/lib/catalogo";
import { correoConfigurado } from "@/lib/correo";
import { pagoOnlineActivo } from "@/lib/mercadopago";
import { tieneEtiqueta } from "@/lib/productos";

export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  const [catalogo, secciones] = await Promise.all([obtenerCatalogo(), obtenerSecciones()]);
  // La bolsita vive en el navegador: le pasamos solo lo que necesita para mostrar y sumar.
  const resumen = catalogo.map(({ id, nombre, precio, stock, tipo, porCantidad }) => ({ id, nombre, precio, stock, tipo, porCantidad }));
  // Como con las categorías: una sección sin productos no aparece en el menú.
  const conProductos = secciones.filter((s) => catalogo.some((p) => tieneEtiqueta(p, s.id))).map((s): [string, string] => [s.id, s.nombre]);

  return (
    <>
      <a className="saltar" href="#contenido">
        Ir al contenido
      </a>
      <ProveedorBolsita catalogo={resumen} pagoOnline={pagoOnlineActivo} envio={await obtenerAjustesEnvio()} cotizaCorreo={correoConfigurado}>
        <Cabecera secciones={conProductos} />
        <main id="contenido">{children}</main>
        <Pie />
      </ProveedorBolsita>
    </>
  );
}
