"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { unidades } from "@/lib/bolsita";
import { PAGINAS } from "@/lib/paginas";
import { useAccionesBolsita, useBolsita } from "./Bolsita";
import { Isotipo } from "./CuadernoAlado";

export function Cabecera() {
  const ruta = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { abrir } = useAccionesBolsita();
  const cantidad = unidades(useBolsita());

  return (
    <header className="cabecera">
      <div className="contenedor cabecera__fila">
        <Link className="logo" href="/" aria-label="Alas de Ángel Creaciones, inicio">
          <Isotipo />
          <span>Alas de Ángel · Creaciones</span>
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
          Bolsita <span className="bolsita-boton__cuenta">{cantidad}</span>
        </button>
      </div>
    </header>
  );
}
