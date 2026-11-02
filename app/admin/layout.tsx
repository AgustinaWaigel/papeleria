import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NavAdmin } from "@/components/admin/NavAdmin";
import { Isotipo } from "@/components/Alas";
import { MARCA } from "@/lib/marca";

export const metadata: Metadata = {
  title: { default: "Panel", template: `%s · Panel · ${MARCA.completo}` },
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return (
    <div className="admin">
      <header className="cabecera">
        <div className="contenedor cabecera__fila">
          <Link className="logo" href="/admin">
            <Isotipo />
            <span>
              {MARCA.nombre}<small>Panel</small>
            </span>
          </Link>
          <Link className="boton boton--claro boton--chico" href="/" target="_blank">
            Ver la tienda
          </Link>
        </div>
        {/* NavAdmin lee la dirección: en las rutas con [id] eso recién se sabe con la visita. */}
        <Suspense>
          <NavAdmin />
        </Suspense>
      </header>
      <main className="contenedor admin__cuerpo">{children}</main>
    </div>
  );
}
