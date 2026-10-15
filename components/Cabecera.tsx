"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { unidades } from "@/lib/bolsita";
import { PAGINAS } from "@/lib/paginas";
import { useAccionesBolsita, useRenglones } from "./Bolsita";
import { Isotipo } from "./Alas";

export function Cabecera() {
  const ruta = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { abrir } = useAccionesBolsita();
  const cantidad = unidades(useRenglones());

  return (
    <header className="cabecera">
      <div className="contenedor cabecera__fila">
        <Link className="logo" href="/" aria-label="Alas de Ángel Papelería, inicio">
          <Isotipo />
          <span>Alas de Ángel<small>Papelería</small></span>
        </Link>

        <nav id="navegacion" aria-label="Principal" className={menuAbierto ? "abierto" : undefined}>
          <ul className="menu">
            {PAGINAS.map(([href, nombre]) => (
              <li key={href}>
                <Link href={href} aria-current={ruta === href ? "page" : undefined} onClick={() => setMenuAbierto(false)}>
                  {nombre}
                </Link>
              </li>
            ))}
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
