"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { salir } from "@/app/admin/acciones";

const SECCIONES: [href: string, nombre: string][] = [
  ["/admin/pedidos", "Pedidos y ventas"],
  ["/admin", "Productos"],
  ["/admin/categorias", "Categorías"],
  ["/admin/secciones", "Secciones"],
  ["/admin/cupones", "Cupones"],
  ["/admin/envios", "Envíos"],
  ["/admin/resenas", "Reseñas"],
  ["/admin/suscriptores", "Suscriptores"],
  ["/admin/arrepentimientos", "Arrepentimientos"],
];

/* "Productos" vive en /admin y también abarca /admin/productos/… */
const activa = (ruta: string, href: string) =>
  href === "/admin" ? ruta === "/admin" || ruta.startsWith("/admin/productos") : ruta.startsWith(href);

export function NavAdmin() {
  const ruta = usePathname();
  if (ruta === "/admin/ingresar") return null;

  return (
    <nav className="admin__nav" aria-label="Secciones del panel">
      <div className="contenedor admin__nav-fila">
        <ul className="menu">
          {SECCIONES.map(([href, nombre]) => (
            <li key={href}>
              <Link href={href} aria-current={activa(ruta, href) ? "page" : undefined}>
                {nombre}
              </Link>
            </li>
          ))}
        </ul>
        <form action={salir}>
          <button className="admin__salir" type="submit">
            Salir
          </button>
        </form>
      </div>
    </nav>
  );
}
