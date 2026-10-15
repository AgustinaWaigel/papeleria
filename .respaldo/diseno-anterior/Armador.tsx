"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { enlaceWhatsApp } from "@/lib/contacto";

const PRODUCTOS = ["Cuaderno A5", "Cuaderno A4", "Agenda 2027", "Libreta de bolsillo"];
const COLORES = [
  ["lavanda", "Lavanda"],
  ["amanecer", "Amanecer"],
  ["halo", "Halo"],
  ["menta", "Menta"],
  ["tinta", "Tinta"],
];
const INTERIORES = ["Rayado", "Punteado", "Liso"];

const MOTIVOS: Record<string, { nombre: string; trazo: ReactNode }> = {
  pluma: {
    nombre: "Pluma",
    trazo: (
      <>
        <path d="M-22,26 C-18,-6 4,-30 26,-30 C28,-6 6,18 -22,26 Z" />
        <path className="sin" d="M-14,16 L12,-14" />
      </>
    ),
  },
  estrella: { nombre: "Estrella", trazo: <path d="M0,-28 L8,-9 28,-9 12,4 18,24 0,12 -18,24 -12,4 -28,-9 -8,-9 Z" /> },
  luna: { nombre: "Luna", trazo: <path d="M8,-28 A28,28 0 1 0 28,8 A22,22 0 0 1 8,-28 Z" /> },
  ninguno: { nombre: "Sin dibujo", trazo: null },
};

type GrupoProps = {
  titulo: string;
  nombre: string;
  opciones: string[][];
  valor: string;
  alElegir: (valor: string) => void;
  conMuestra?: boolean;
};

function Grupo({ titulo, nombre, opciones, valor, alElegir, conMuestra }: GrupoProps) {
  return (
    <fieldset className="campo">
      <legend>{titulo}</legend>
      <div className="opciones">
        {opciones.map(([id, etiqueta]) => (
          <label
            key={id}
            className={`opcion${conMuestra ? " opcion--color" : ""}`}
            style={conMuestra ? ({ "--c": `var(--color-${id})` } as CSSProperties) : undefined}
          >
            <input type="radio" name={nombre} value={id} checked={valor === id} onChange={() => alElegir(id)} />
            <span>{etiqueta}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const pares = (lista: string[]) => lista.map((x) => [x, x]);

export function Armador() {
  const [producto, setProducto] = useState(PRODUCTOS[0]);
  const [color, setColor] = useState("lavanda");
  const [motivo, setMotivo] = useState("pluma");
  const [interior, setInterior] = useState(INTERIORES[0]);
  const [texto, setTexto] = useState("");

  const lineas = [
    `Producto: ${producto}`,
    `Tapa: ${COLORES.find(([id]) => id === color)?.[1]}`,
    `Dibujo: ${MOTIVOS[motivo].nombre}`,
    `Interior: ${interior}`,
    `Texto en la tapa: ${texto.trim() || "(sin texto)"}`,
  ];
  const pedido = `¡Hola Alas de Ángel! Quiero un personalizado:\n\n${lineas.map((l) => `• ${l}`).join("\n")}`;

  const colores = {
    "--c": `var(--color-${color})`,
    "--sobre": color === "tinta" ? "var(--color-nube)" : "var(--color-tinta)",
  } as CSSProperties;

  return (
    <div className="contenedor armador">
      <div className="armador__vista" style={colores}>
        <svg viewBox="0 0 240 300" role="img" aria-label="Vista previa de la tapa">
          <rect className="tapa borde-tapa" x="30" y="20" width="180" height="260" rx="10" />
          <path className="linea-tapa" d="M52 20v260M190 20v260" />
          <g className="motivo" transform="translate(121 118) scale(1.5)">
            {MOTIVOS[motivo].trazo}
          </g>
          <text className="nombre-tapa" x="121" y="204" textAnchor="middle">
            {texto.trim() || "Tu nombre"}
          </text>
          <rect className="sobre-tapa" x="101" y="218" width="40" height="2.5" rx="1" />
        </svg>
        <p className="armador__resumen" aria-live="polite">
          {lineas.join(" · ")}
        </p>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        <Grupo titulo="Qué querés personalizar" nombre="producto" opciones={pares(PRODUCTOS)} valor={producto} alElegir={setProducto} />
        <Grupo titulo="Color de la tapa" nombre="color" opciones={COLORES} valor={color} alElegir={setColor} conMuestra />
        <Grupo
          titulo="Dibujo"
          nombre="motivo"
          opciones={Object.entries(MOTIVOS).map(([id, m]) => [id, m.nombre])}
          valor={motivo}
          alElegir={setMotivo}
        />
        <Grupo titulo="Interior" nombre="interior" opciones={pares(INTERIORES)} valor={interior} alElegir={setInterior} />

        <div className="campo">
          <label htmlFor="nombre-tapa">Nombre o frase para la tapa</label>
          <input
            type="text"
            id="nombre-tapa"
            maxLength={16}
            autoComplete="off"
            aria-describedby="ayuda-nombre"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <span className="campo__ayuda" id="ayuda-nombre">
            Hasta 16 letras. Si la dejás vacía, va sin texto.
          </span>
        </div>

        <a className="boton boton--ancho" href={enlaceWhatsApp(pedido)} target="_blank" rel="noopener">
          Pedir este diseño por WhatsApp
        </a>
        <p className="campo__ayuda mt-e3">
          La vista previa es una guía: antes de imprimir te mandamos la muestra final para que la apruebes.
        </p>
      </form>
    </div>
  );
}
