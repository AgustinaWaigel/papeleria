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
| "Sumar a la bolsita" | "Añadir al carrito" |
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
| `--color-tinta` | `#0B5E41` | Verde oscuro. Texto, títulos, bordes, botones principales, pie de página. Es el "negro" de la marca. |
| `--color-tinta-suave` | `#2F6E55` | Texto secundario. |
| `--color-nube` | `#F6E7D4` | Crema. Fondo general. |
| `--color-cielo` | `#F9D5E4` | Rosa muy claro. Fondos de apoyo. |
| `--color-renglon` | `#E3CDB6` | Líneas decorativas. |
| `--color-amanecer` | `#7F2350` | Vino. Portadas internas, títulos sobre rosa, etiquetas, foco. |
| `--color-amanecer-fuerte` | `#6A1B42` | Vino para texto chico (enlaces, etiquetas). |
| `--color-halo` | `#B9D53B` | Lima. Resaltado de palabras, franja de cierre, cinta washi. |
| `--color-lavanda` | `#F4A9CB` | Rosa. Bandas de sección, color de producto. |
| `--color-menta` | `#7CC4A0` | Verde claro. Color de producto y apoyo. |

Los nombres son de la marca, no del tono. Amanecer, halo, lavanda y menta tienen versión `-suave` para fondos.

Uso: crema de base, verde oscuro para leer, y rosa, vino y lima en bloques enteros. Sobre vino y sobre verde oscuro el texto va en nube, nunca en tinta.

## Tipografía

| Variable | Fuente | Uso |
| --- | --- | --- |
| `--fuente-titulo` | Unbounded | Títulos (h1 y h2 en mayúscula sostenida), precios, nombre de la marca. |
| `--fuente-texto` | Karla | Todo lo demás: párrafos, botones, menú. |
| `--fuente-etiqueta` | Unbounded | Etiquetas y notas cortas, chicas, en mayúscula y espaciadas. |

Las dos son de Google Fonts. Tamaños: `--texto-xs` a `--texto-3xl`, más `--texto-etiqueta`.

## Combinaciones de color

Los bloques de color van siempre en una de estas parejas de fondo y título:

| Fondo | Título | Texto | Dónde |
| --- | --- | --- | --- |
| Crema (`nube`) | Verde oscuro (`tinta`) | `tinta` | Portada de inicio, secciones comunes. |
| Rosa (`lavanda`) | Vino (`amanecer`) | `tinta` | Secciones alternadas. |
| Vino (`amanecer`) | Rosa (`lavanda`) | `nube` | Portadas de páginas internas. |
| Lima (`halo`) | Verde oscuro (`tinta`) | `tinta` | Franja de cierre. |
| Verde oscuro (`tinta`) | Lima (`halo`) | `nube` | Pie de página. |

Los cuatro estantes de inicio usan una combinación cada uno.

## Recursos gráficos

- **Resaltado:** una palabra del título con fondo lima, como pasada con marcador (clase `resalte`). Una por título, como mucho.
- **Cintas onduladas:** un trazo grueso pintado por tramos en vino, rosa, lima y verde. Solo en la portada de inicio.
- **Stickers:** los dibujos de producto llevan un borde claro alrededor, como troquelados.
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
| Página de cada producto (fotos, descripción, características) | `/producto/<id>` | `app/producto/[id]/page.tsx` |
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
