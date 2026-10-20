import { ProveedorBolsita } from "@/components/Bolsita";
import { Cabecera } from "@/components/Cabecera";
import { Pie } from "@/components/Pie";
import { obtenerAjustesEnvio, obtenerCatalogo } from "@/lib/catalogo";
import { correoConfigurado } from "@/lib/correo";
import { pagoOnlineActivo } from "@/lib/mercadopago";

export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  // La bolsita vive en el navegador: le pasamos solo lo que necesita para mostrar y sumar.
  const resumen = (await obtenerCatalogo()).map(({ id, nombre, precio, stock, tipo }) => ({ id, nombre, precio, stock, tipo }));

  return (
    <>
      <a className="saltar" href="#contenido">
        Ir al contenido
      </a>
      <ProveedorBolsita catalogo={resumen} pagoOnline={pagoOnlineActivo} envio={await obtenerAjustesEnvio()} cotizaCorreo={correoConfigurado}>
        <Cabecera />
        <main id="contenido">{children}</main>
        <Pie />
      </ProveedorBolsita>
    </>
  );
}
