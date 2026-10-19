# Alas de Ángel — manual de marca

Papelería creativa: productos físicos, descargables para imprimir y diseños personalizados.

## Concepto: cada hoja, un ala

Un cuaderno abierto tiene dos alas. De ahí sale todo:

- **El símbolo** es un cuaderno abierto cuyas hojas se despliegan en abanico, como alas. Nada de aureolas, angelitos ni nubes de algodón: lo angelical está en la liviandad, no en la iconografía religiosa.
- **El papel está en las piezas, no en el fondo.** Los fondos son bloques lisos de color pleno; lo que parece papel son las fichas y los papelitos.
- **Las cosas están pegadas, no flotando.** Las fichas de producto llevan un pedacito de cinta washi arriba y una sombra dura, como recortes pegados en una hoja.
- **Pluma** es a la vez pluma de ala y pluma de escribir. Se puede jugar con eso, sin abusar.

Frase de marca: **Papel para ideas que quieren volar.**

## Voz

Español rioplatense, de vos. Cercana, clara y con un guiño, como una amiga que sabe mucho de papelería.

| Sí | No |
| --- | --- |
| "Elegí tu tapa y contanos qué nombre lleva." | "Seleccione las opciones de personalización." |
| "Agregar a la bolsita" | "Añadir al carrito" |
| "Te lo mandamos por mail apenas se acredita el pago." | "El envío digital se procesará oportunamente." |
| Una imagen de vuelo cada tanto. | Una metáfora de alas en cada oración. |

Reglas:

- Los botones dicen lo que hacen: "Ver la papelería", "Enviar pedido por WhatsApp".
- El carrito se llama **la bolsita**. Siempre igual, en todo el sitio.
- Sin signos de exclamación en cadena, sin mayúsculas para gritar, sin emojis en la interfaz.
- Los títulos se escriben en minúscula tipo oración ("Recién salidos del taller"), nunca En Mayúsculas Cada Palabra. La mayúscula sostenida la pone el estilo, no el texto.
- La letra ancha de etiqueta es para notas cortas (dos a seis palabras). Nunca para párrafos ni para información importante.

## Color

Todos están en `tokens.css`. Nunca se escriben a mano.

| Variable | Valor | Para qué |
| --- | --- | --- |
| `--color-tinta` | `#163F40` | Verde petróleo. Texto, bordes, botones principales, pie de página. Es el "negro" de la marca. |
| `--color-tinta-suave` | `#3F6566` | Texto secundario. |
| `--color-nube` | `#FEFFE0` | Amarillo claro. Fondo general. |
| `--color-cielo` | `#DCF2EF` | Bandas de sección, fondos de apoyo. |
| `--color-renglon` | `#B9DDD8` | Líneas decorativas. |
| `--color-amanecer` | `#B5185F` | Cereza. Acento principal: fondo de la portada y de la franja de cierre, detalles, foco. |
| `--color-amanecer-fuerte` | `#96114D` | Cereza para texto chico (enlaces, etiquetas). |
| `--color-halo` | `#D0E86E` | Lima. Títulos y botón principal sobre cereza, cinta washi. Nunca como fondo grande. |
| `--color-lavanda` | `#35C1C2` | Turquesa. Bandas de sección, color de producto. |
| `--color-lavanda-fuerte` | `#17999C` | Turquesa para títulos sobre nube. |
| `--color-menta` | `#F4A6C8` | Rosa. Color de producto y apoyo. |

Los nombres son de la marca, no del tono. Amanecer, halo, lavanda y menta tienen versión `-suave` para fondos.

Uso: mucho nube y tinta, cielo para separar, cereza en la portada y los demás colores en dosis chicas. Sobre cereza los títulos van en lima y el texto en nube, nunca en tinta (no llega al contraste).

## Tipografía

| Variable | Fuente | Uso |
| --- | --- | --- |
| `--fuente-titulo` | Anton | Títulos (en mayúscula sostenida), precios, nombre de la marca. |
| `--fuente-texto` | Karla | Todo lo demás: párrafos, botones, menú. |
| `--fuente-etiqueta` | Syncopate | Etiquetas y notas cortas, chicas y en mayúscula. |

Las tres son de Google Fonts. Tamaños: `--texto-xs` a `--texto-3xl`, más `--texto-etiqueta`.

## Combinaciones de color

Los bloques de color van siempre en una de estas cuatro parejas de fondo y título:

| Fondo | Título | Texto | Dónde |
| --- | --- | --- | --- |
| Cereza (`amanecer`) | Lima (`halo`) | `nube` | Portada, portadas internas, franja de cierre. |
| Amarillo claro (`nube`) | Turquesa (`lavanda-fuerte`) | `tinta` | Secciones comunes. |
| Turquesa (`lavanda`) | Amarillo claro (`nube`) | `tinta` | Secciones alternadas. |
| Lima (`halo`) | Cereza (`amanecer`) | `tinta` | Solo en piezas chicas (un estante), nunca en una sección entera. |

Sobre `nube` el título turquesa usa `--color-lavanda-fuerte`, un poco más oscuro, para que se lea.

## Formas

- Bordes de `--linea` en tinta y sombra dura (`--sombra-sello`). Sin sombras difusas en las fichas.
- Radios: `--radio-m` para fichas, `--radio-pastilla` para botones y filtros.
- Los dibujos de producto son ilustraciones de línea (trazo tinta + un color plano), definidas en `lib/productos.tsx`. Cuando haya fotos reales, se reemplazan ahí.
- El aleteo del cuaderno es el único movimiento protagonista. Lo demás son transiciones cortas. Todo se apaga con `prefers-reduced-motion`.

## Mapa del sitio

| Página | Ruta | Archivo |
| --- | --- | --- |
| Inicio | `/` | `app/page.tsx` |
| Papelería (productos físicos, con filtros) | `/papeleria` | `app/papeleria/page.tsx` |
| Descargables (PDF y plantillas) | `/descargables` | `app/descargables/page.tsx` |
| Personalizados (armador de tapa con vista previa) | `/personalizados` | `app/personalizados/page.tsx` |
| Packs regalo | `/packs-regalo` | `app/packs-regalo/page.tsx` |
| Cuaderno de ideas (blog) | `/cuaderno-de-ideas` | `app/cuaderno-de-ideas/page.tsx` |
| Sobre nosotras | `/sobre-nosotras` | `app/sobre-nosotras/page.tsx` |
| Preguntas frecuentes | `/preguntas-frecuentes` | `app/preguntas-frecuentes/page.tsx` |
| Contacto | `/contacto` | `app/contacto/page.tsx` |

## Cómo está armado

Next.js (App Router) + TypeScript + Tailwind CSS 4. `npm run dev` para trabajar, `npm run build` para compilar.

- `marca/tokens.css` — las variables de marca. `marca/tokens.json` guarda los mismos valores: si cambia uno, cambian los dos.
- `app/globals.css` — conecta Tailwind con la marca. El tema de Tailwind **solo** tiene valores de la marca: `bg-halo`, `text-tinta-suave`, `font-titulo`, `text-xl`, `rounded-m`, `shadow-sello`, y los espacios `e1` a `e9` (`p-e5`, `gap-e4`, `mt-e7`). No existen `bg-blue-500` ni `p-4`.
- `app/sitio.css` — las piezas propias de la marca (las fichas con cinta, el cuaderno alado, la bolsita), como clases en la capa `components`. Las utilidades de Tailwind las pisan.
- `components/` — `Bloques.tsx` (portadilla, sección, franja), `Ficha.tsx`, `Catalogo.tsx`, `Bolsita.tsx`, `Armador.tsx`, `CuadernoAlado.tsx`, cabecera y pie.
- `lib/productos.tsx` — la lista de productos, descargables y packs, y sus dibujos. **Para agregar o cambiar un producto se edita solo este archivo.**
- `lib/contacto.ts` — WhatsApp, mail e Instagram.
- `lib/bolsita.ts` — la bolsita, guardada en el navegador.

Las fuentes se cargan con `next/font` en `app/layout.tsx`.

No hay pasarela de pago: la bolsita arma el pedido y lo manda por WhatsApp.
