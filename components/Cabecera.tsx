"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { unidades } from "@/lib/bolsita";
import { PAGINAS, RUTAS_PRODUCTOS } from "@/lib/paginas";
import { useAccionesBolsita, useRenglones } from "./Bolsita";
import { Isotipo } from "./Alas";

/* secciones: las del menú "Productos" que tienen algo para mostrar (ver app/(tienda)/layout.tsx). */
export function Cabecera({ secciones }: { secciones: [id: string, nombre: string][] }) {
  const ruta = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [productosAbierto, setProductosAbierto] = useState(false);
  const desplegable = useRef<HTMLLIElement>(null);
  const { abrir } = useAccionesBolsita();
  const cantidad = unidades(useRenglones());

  const deProductos = PAGINAS.filter(([href]) => RUTAS_PRODUCTOS.includes(href));
  const sueltas = PAGINAS.filter(([href]) => !RUTAS_PRODUCTOS.includes(href));
  const enProductos = deProductos.some(([href]) => href === ruta) || ruta.startsWith("/seccion/");

  // El desplegable se cierra al tocar afuera o con Escape (y el foco vuelve al botón).
  useEffect(() => {
    if (!productosAbierto) return;
    const afuera = (e: PointerEvent) => {
      if (!desplegable.current?.contains(e.target as Node)) setProductosAbierto(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setProductosAbierto(false);
      desplegable.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", afuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", afuera);
      document.removeEventListener("keydown", escape);
    };
  }, [productosAbierto]);

  const cerrar = () => {
    setMenuAbierto(false);
    setProductosAbierto(false);
  };
  const enlace = ([href, nombre]: [string, string]) => (
    <li key={href}>
      <Link href={href} aria-current={ruta === href ? "page" : undefined} onClick={cerrar}>
        {nombre}
      </Link>
    </li>
  );

  return (
    <header className="cabecera">
      <div className="contenedor cabecera__fila">
        <Link className="logo" href="/" aria-label="Alas de Ángel Papelería, inicio">
          <Isotipo />
          <span>Alas de Ángel<small>Papelería</small></span>
        </Link>

        <nav id="navegacion" aria-label="Principal" className={menuAbierto ? "abierto" : undefined}>
          <ul className="menu">
            <li className="desplegable" ref={desplegable}>
              <button
                className="desplegable__boton"
                type="button"
                aria-expanded={productosAbierto}
                aria-controls="menu-productos"
                data-actual={enProductos || undefined}
                onClick={() => setProductosAbierto(!productosAbierto)}
              >
                Productos
              </button>
              <div id="menu-productos" className="desplegable__panel" hidden={!productosAbierto}>
                <ul>{deProductos.map(enlace)}</ul>
                {secciones.length > 0 && (
                  <>
                    <p className="desplegable__titulo" id="menu-secciones">
                      Por sección
                    </p>
                    <ul aria-labelledby="menu-secciones">{secciones.map(([id, nombre]) => enlace([`/seccion/${id}`, nombre]))}</ul>
                  </>
                )}
              </div>
            </li>
            {sueltas.map(enlace)}
          </ul>
        </nav>

        <Link
          className="boton boton--claro boton--chico cabecera__buscar"
          href="/buscar"
          aria-current={ruta === "/buscar" ? "page" : undefined}
        >
          Buscar
        </Link>
        <button
          className="boton boton--claro boton--chico cabecera__menu-boton"
          type="button"
          aria-expanded={menuAbierto}
          aria-controls="navegacion"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          Menú
        </button>
        <button className="boton boton--chico bolsita-boton" type="button" onClick={abrir}>
          Bolsita {/* La key vuelve a montar el número y dispara el saltito cada vez que cambia. */}
          <span className="bolsita-boton__cuenta" key={cantidad}>
            {cantidad}
          </span>
        </button>
      </div>
    </header>
  );
}
