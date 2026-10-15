import type { Metadata } from "next";
import Link from "next/link";
import { Portadilla } from "@/components/Bloques";

export const metadata: Metadata = {
  title: "Cuaderno de ideas",
  description: "Notas cortas sobre organización, escritura a mano y cómo sacarle el jugo a la papelería.",
};

export default function CuadernoDeIdeas() {
  return (
    <>
      <Portadilla nota="anotaciones al margen" titulo="Cuaderno de ideas">
        Notas cortas sobre organizarse, escribir a mano y sacarle el jugo a un buen papel.
      </Portadilla>

      <div className="contenedor">
        <article className="articulo" id="estrenar-cuaderno">
          <span className="nota-mano">empezar</span>
          <h2>Cómo estrenar un cuaderno sin miedo a arruinarlo</h2>
          <p>
            Pasa siempre: el cuaderno es tan lindo que da pena escribirlo, y termina meses en un cajón esperando una ocasión
            que esté a su altura. Un cuaderno guardado no sirve para nada. Estas son cinco maneras de romper el hielo.
          </p>
          <ol>
            <li>
              <strong>Empezá por la segunda hoja.</strong> La primera queda en blanco y más adelante decidís qué va ahí.
            </li>
            <li>
              <strong>Probá las lapiceras en la última página.</strong> Es útil (sabés cuál traspasa) y el cuaderno deja de
              estar intacto.
            </li>
            <li>
              <strong>Escribí la fecha y dónde estás.</strong> Nada más. Ya empezó.
            </li>
            <li>
              <strong>Copiá una frase que te guste.</strong> Una letra de canción, algo que te dijo alguien. No hace falta
              que sea tuya.
            </li>
            <li>
              <strong>Dale un trabajo.</strong> “Cuaderno de la facu”, “ideas para el emprendimiento”, “listas de todo”. Un
              cuaderno con tarea se usa; uno “para algo especial” se guarda.
            </li>
          </ol>
          <p>Y si una hoja sale mal, se tapa con un sticker o con washi tape. Para eso existen.</p>
        </article>

        <article className="articulo" id="semana-en-una-hoja">
          <span className="nota-mano">organización</span>
          <h2>Una semana entera en una sola hoja</h2>
          <p>
            Planificar la semana no debería llevar más de diez minutos. Si lleva más, el sistema es muy complicado y lo vas
            a abandonar en febrero. Este entra en una hoja.
          </p>
          <h3>Primero, tres prioridades</h3>
          <p>
            Arriba de todo, anotá las tres cosas que, si salen, hacen que la semana haya valido la pena. Tres, no ocho. Todo
            lo demás es secundario.
          </p>
          <h3>Después, lo que tiene horario</h3>
          <p>
            Turnos, clases, reuniones, cumpleaños. Van en su día. Es lo único que no se puede mover, así que conviene verlo
            antes de prometer nada más.
          </p>
          <h3>Al final, los pendientes sueltos</h3>
          <p>
            Una lista aparte, sin día asignado. Cada mañana elegís uno o dos según cómo venga la mano. Lo que no se hizo el
            domingo pasa a la hoja siguiente o se tacha sin culpa.
          </p>
          <p>
            Podés armarlo con regla en cualquier cuaderno, o usar el{" "}
            <Link href="/descargables">planner semanal imprimible</Link>, que ya viene con esas tres zonas.
          </p>
        </article>

        <article className="articulo" id="imprimir-en-casa">
          <span className="nota-mano">descargables</span>
          <h2>Imprimir en casa y que quede lindo</h2>
          <p>
            Una plantilla linda puede quedar torcida, cortada o lavada si la impresora hace lo que quiere. Tres ajustes
            resuelven casi todo.
          </p>
          <h3>El papel</h3>
          <p>
            El de resma común (75 u 80 gramos) sirve para hojas de uso diario. Para algo que vas a usar todo el año, como un
            planner mensual, uno de 90 o 100 gramos se transparenta menos y aguanta mejor el resaltador. Para tarjetas y
            banderines, cartulina de 180 gramos o más.
          </p>
          <h3>La configuración</h3>
          <ul>
            <li>
              En tamaño, elegí <strong>“tamaño real”</strong> o <strong>“100 %”</strong>. “Ajustar a la página” achica todo
              y corre los márgenes.
            </li>
            <li>
              Si vas a imprimir de los dos lados, probá primero con una sola hoja para ver de qué lado la da vuelta tu
              impresora.
            </li>
            <li>Calidad “normal” alcanza. “Borrador” ahorra tinta, pero los colores pastel casi no se ven.</li>
          </ul>
          <h3>Encuadernar sin anilladora</h3>
          <p>
            Un broche de carpeta, dos ganchitos mariposa o una costura simple al medio con hilo encerado. O una perforadora
            y cualquier carpeta de dos anillos, que además te deja sumar y sacar hojas.
          </p>
        </article>
      </div>
    </>
  );
}
