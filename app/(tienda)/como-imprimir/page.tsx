import type { Metadata } from "next";
import Link from "next/link";
import { Franja, Portadilla } from "@/components/Bloques";
import { enlaceWhatsApp } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "Cómo imprimir los descargables",
  description:
    "Guía para imprimir los descargables de Alas de Ángel: qué papel usar, cómo configurar la impresora, qué pedir en la librería y cómo recortar y encuadernar.",
};

const INDICE: [id: string, titulo: string][] = [
  ["antes", "Antes de imprimir"],
  ["papel", "Qué papel usar"],
  ["impresora", "La impresora"],
  ["libreria", "En la librería"],
  ["armar", "Recortar y encuadernar"],
  ["problemas", "Si algo sale mal"],
];

const PAPELES: [para: string, papel: string, nota: string][] = [
  ["Hojas de todos los días (listas, horarios, hojas de estudio)", "Obra o resma común, 75 u 80 g", "Barato y alcanza. Se transparenta un poco con fibra."],
  ["Planners y agendas que usás todo el año", "Obra de 90 o 100 g", "Se transparenta menos y aguanta el resaltador."],
  ["Tapas, tarjetas, banderines y etiquetas de regalo", "Opalina o cartulina de 180 a 240 g", "Fijate que tu impresora la acepte (la mayoría llega a 200 g)."],
  ["Stickers y etiquetas para pegar", "Autoadhesivo A4 (mate o brillante)", "El mate se puede escribir encima; el brillante tiene colores más vivos."],
  ["Láminas para enmarcar", "Fotográfico o ilustración de 150 g o más", "Con impresora de tinta, en calidad alta."],
];

const PROBLEMAS: [problema: string, solucion: string][] = [
  [
    "Se corta el borde o queda torcido",
    "La impresora está achicando o corriendo la hoja. Elegí “tamaño real” o “100 %” (no “ajustar a la página”) y revisá que el papel elegido sea A4.",
  ],
  [
    "Queda un margen blanco alrededor",
    "Es normal: casi ninguna impresora de casa imprime hasta el borde. Si el diseño tiene fondo de color, recortá el margen con regla y cutter.",
  ],
  [
    "Los colores se ven distintos que en la pantalla",
    "Pasa siempre: la pantalla tiene luz propia y la tinta no. Imprimí en calidad normal o alta (nunca en “borrador”) y probá con otro papel: el blanco brillante da colores más vivos.",
  ],
  [
    "La doble faz salió al revés",
    "Cada impresora da vuelta la hoja a su manera. Imprimí una sola hoja de prueba y marcá con lápiz de qué lado y en qué sentido la tenés que volver a poner.",
  ],
  [
    "El archivo no abre o se ve raro en el celular",
    "Bajalo de nuevo desde el mail o la página de tu pedido y abrilo con Adobe Acrobat Reader, que es gratis. Si tiene campos editables, completalos ahí y guardá antes de imprimir.",
  ],
];

export default function ComoImprimir() {
  return (
    <>
      <Portadilla nota="de la pantalla a la hoja" titulo="Cómo imprimir los descargables">
        Todo lo que conviene saber para que tus plantillas queden derechas, con buenos colores y en el papel justo, ya sea en
        tu casa o en la librería de la esquina.
      </Portadilla>

      <div className="contenedor">
        <nav className="filtros guia__indice" aria-label="En esta guía">
          {INDICE.map(([id, titulo]) => (
            <a key={id} className="filtro" href={`#${id}`}>
              {titulo}
            </a>
          ))}
        </nav>

        <aside className="papelito guia__lista" aria-labelledby="lista-titulo">
          <h2 id="lista-titulo">
            Antes de tocar «Imprimir»
          </h2>
          <ul>
            <li>Tamaño de papel: A4.</li>
            <li>Escala: tamaño real o 100 %.</li>
            <li>Calidad: normal o alta, en color.</li>
            <li>Una hoja de prueba primero, sobre todo si es doble faz o papel caro.</li>
          </ul>
        </aside>

        <article className="articulo" id="antes">
          <span className="nota-mano">paso 1</span>
          <h2>Antes de imprimir</h2>
          <p>
            Cuando se acredita el pago te llega un mail con un botón para bajar cada PDF. También los encontrás en la página de
            tu pedido, así que no pasa nada si borrás el mail.
          </p>
          <ul>
            <li>
              <strong>Bajalo a la compu si podés.</strong> Imprimir desde el celular se puede, pero la compu te deja ver y
              cambiar todas las opciones de la impresora.
            </li>
            <li>
              <strong>Abrilo con un lector de PDF.</strong> El navegador alcanza para la mayoría. Para los que dicen
              «editable», usá Adobe Acrobat Reader (gratis): completás los campos, guardás y después imprimís.
            </li>
            <li>
              <strong>Guardá una copia.</strong> Lo podés imprimir todas las veces que quieras: tenelo a mano para el año que
              viene o para cuando se termine.
            </li>
          </ul>
        </article>

        <article className="articulo" id="papel">
          <span className="nota-mano">paso 2</span>
          <h2>Qué papel usar</h2>
          <p>
            El gramaje (los «g» del paquete) dice qué tan grueso es. Más gramos, más firme y menos transparente, pero también
            más caro y más difícil para algunas impresoras.
          </p>
          <div className="guia__tabla-marco">
            <table className="guia__tabla">
              <thead>
                <tr>
                  <th scope="col">Para</th>
                  <th scope="col">Papel</th>
                  <th scope="col">Por qué</th>
                </tr>
              </thead>
              <tbody>
                {PAPELES.map(([para, papel, nota]) => (
                  <tr key={para}>
                    <th scope="row">{para}</th>
                    <td>{papel}</td>
                    <td>{nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="articulo" id="impresora">
          <span className="nota-mano">paso 3</span>
          <h2>Cómo configurar la impresora</h2>
          <p>Las opciones cambian de nombre según la marca, pero siempre están en la ventana que aparece al tocar «Imprimir».</p>
          <h3>Tamaño real, siempre</h3>
          <p>
            Buscá <strong>«Escala»</strong> o <strong>«Tamaño»</strong> y elegí <strong>«Tamaño real»</strong>,{" "}
            <strong>«100 %»</strong> o <strong>«Ninguno»</strong>. La opción «Ajustar a la página» achica todo un poco y corre
            los márgenes: las casillas dejan de coincidir y los recortes no cierran.
          </p>
          <h3>Papel y calidad</h3>
          <ul>
            <li>Tamaño de papel: A4 (no «Carta», que viene por defecto en muchas impresoras).</li>
            <li>Tipo de papel: si usás cartulina, autoadhesivo o fotográfico, decíselo a la impresora. Así pone la tinta justa.</li>
            <li>Calidad: «normal» alcanza para casi todo. «Borrador» ahorra tinta, pero los colores pastel casi desaparecen.</li>
          </ul>
          <h3>Doble faz</h3>
          <p>
            Si tu impresora no lo hace sola, imprimí primero las páginas impares, dá vuelta la pila y después las pares. Antes,
            probá con una sola hoja y marcala con lápiz para saber de qué lado y en qué sentido va.
          </p>
          <h3>Planners en A5</h3>
          <p>
            Los que vienen en A5 se imprimen de a dos por hoja A4: en «Páginas por hoja» elegí 2, o usá la opción «Folleto» si
            lo querés doblar al medio como un cuadernito.
          </p>
        </article>

        <article className="articulo" id="libreria">
          <span className="nota-mano">sin impresora</span>
          <h2>Imprimirlo en la librería o la fotocopiadora</h2>
          <p>No hace falta tener impresora: cualquier librería o centro de copiado lo imprime en un rato.</p>
          <ol>
            <li>Mandales el PDF por mail o WhatsApp, o llevalo en un pendrive. Siempre el PDF, no una captura de pantalla.</li>
            <li>
              Pediles que lo impriman <strong>«en tamaño real, sin ajustar»</strong>, en color y en A4.
            </li>
            <li>Decí qué papel querés (la tabla de arriba te ayuda). Muchas tienen opalina y autoadhesivo.</li>
            <li>Si es un planner, preguntá si lo anillan o le ponen tapa: sale poco y queda como un cuaderno.</li>
          </ol>
          <p>
            Es para tu uso personal: podés imprimirlo todas las veces que quieras, para vos y tu familia, pero no compartir el
            archivo ni vender las hojas impresas.
          </p>
        </article>

        <article className="articulo" id="armar">
          <span className="nota-mano">el toque final</span>
          <h2>Recortar y encuadernar</h2>
          <h3>Para recortar</h3>
          <ul>
            <li>Regla metálica, cutter y una plancha de corte (o un cartón grueso) dan bordes mucho más prolijos que la tijera.</li>
            <li>Si tenés muchas, en la librería te las pasan por la guillotina.</li>
            <li>Stickers: con tijera chica de punta fina, o pedí autoadhesivo precortado.</li>
          </ul>
          <h3>Para encuadernar sin anilladora</h3>
          <ul>
            <li>Perforadora y una carpeta de dos anillos: podés sumar y sacar hojas cuando quieras.</li>
            <li>Discos de encuadernación (los del sistema de discos): se abren planos y se reacomodan.</li>
            <li>Un broche, dos ganchitos mariposa o una costura al medio con hilo encerado, para cuadernitos A5.</li>
          </ul>
        </article>

        <article className="articulo" id="problemas">
          <span className="nota-mano">si algo sale mal</span>
          <h2>Problemas comunes</h2>
          {PROBLEMAS.map(([problema, solucion]) => (
            <div key={problema}>
              <h3>{problema}</h3>
              <p>{solucion}</p>
            </div>
          ))}
        </article>
      </div>

      <section className="seccion">
        <div className="contenedor">
          <Franja
            titulo="¿Te trabaste con algo?"
            accion={
              <div className="fila-botones">
                <a className="boton" href={enlaceWhatsApp("¡Hola! Tengo una duda para imprimir un descargable:")} target="_blank" rel="noopener">
                  Escribinos
                </a>
                <Link className="boton boton--claro" href="/descargables">
                  Ver descargables
                </Link>
              </div>
            }
          >
            Mandanos una foto de cómo te quedó y lo resolvemos juntas. Si el archivo tiene un error, te lo mandamos de nuevo.
          </Franja>
        </div>
      </section>
    </>
  );
}
