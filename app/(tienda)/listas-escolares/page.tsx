import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Portadilla, Seccion } from "@/components/Bloques";
import { ListaEscolar, type ProductoParaLista } from "@/components/ListaEscolar";
import { obtenerCatalogo, obtenerCategorias } from "@/lib/catalogo";
import { ABIERTAS } from "@/lib/paginas";
import { SECCIONES } from "@/lib/productos";

export const metadata: Metadata = {
  title: "Listas escolares",
  description: "Pegá la lista de útiles del cole y te armamos la bolsita con todo lo que tenemos, para uno o para todo el grado.",
};

const PASOS = [
  ["Pegá la lista", "Copiala del mail, del grupo de WhatsApp o de la foto que mandó la seño, y pegala tal cual."],
  ["Revisá lo que encontramos", "Para cada útil te proponemos un producto. Si no es el que querés, cambialo o sacalo."],
  ["Sumá todo de una vez", "Elegí para cuántos chicos y pasá todo a la bolsita. Si llevás varios del mismo, hay descuento por cantidad."],
];

export default async function ListasEscolares() {
  if (!ABIERTAS.listas) notFound(); // guardada para más adelante (ver lib/paginas.ts)
  const [catalogo, categorias] = await Promise.all([obtenerCatalogo(), obtenerCategorias()]);
  const nombreCat = new Map(Object.values(categorias).flat());
  // Cada producto se busca por todo lo que lo describe, como en el buscador.
  const productos: ProductoParaLista[] = catalogo.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    texto: [p.nombre, p.desc, p.detalle, SECCIONES[p.tipo].nombre, p.cat && nombreCat.get(p.cat), ...(p.etiquetas ?? [])].filter(Boolean).join(" "),
    precio: p.precio,
    porCantidad: p.porCantidad,
    stock: p.stock,
  }));

  return (
    <>
      <Portadilla chica nota="vuelta al cole sin vueltas" titulo="Listas escolares">
        Pegá la lista de útiles y te armamos la bolsita con todo lo que tenemos. Para tu hijo o para todo el grado.
      </Portadilla>

      <Seccion>
        <div className="dos-columnas">
          <ListaEscolar productos={productos} />
          <ol className="pasos pasos--columna">
            {PASOS.map(([titulo, texto]) => (
              <li key={titulo}>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </Seccion>

      <Seccion
        cielo
        nota="¿sos docente o cooperadora?"
        titulo="¿Es para toda la escuela?"
        bajada="Para pedidos grandes, kits armados o cuadernos con el logo de la escuela, pedinos un presupuesto."
        accion={
          <Link className="boton" href="/pedidos-por-mayor">
            Pedir presupuesto
          </Link>
        }
      />
    </>
  );
}
