# Tienda multirubro

La tienda de Alas de Ángel, preparada para cualquier rubro. El sistema completo (catálogo, bolsita, pagos con
Mercado Pago, envíos, cupones, panel, mails) es el mismo; lo que cambia de una tienda a otra sale de
**variables de entorno**.

## Cómo elegir el rubro

Cada archivo de esta carpeta es un rubro completo: nombre, textos, contacto, colores, tipografías y estilo.

| Archivo | Ejemplo |
| --- | --- |
| `papeleria.env` | Alas de Ángel, tal cual el diseño original |
| `gastronomia.env` | Viandas y cocina casera |
| `indumentaria.env` | Ropa, minimalista, sin redondeos ni sombras |
| `belleza.env` | Cosmética natural, serif elegante |
| `mascotas.env` | Pet shop, colores alegres y bordes gruesos |
| `tecnologia.env` | Accesorios, oscuro con acento lima |

En `.env.local` (o en las variables de Vercel) poné:

```
RUBRO=gastronomia
```

Cualquier variable del archivo del rubro se puede pisar ahí mismo, una por una:

```
RUBRO=gastronomia
MARCA_NOMBRE="Rotisería Don Pepe"
COLOR_PRINCIPAL="#1F5FA0"
FUENTE_TITULOS="Bricolage Grotesque"
```

Para probar rubros en tu compu sin tocar `.env.local`:

```
npm run dev:gastronomia
npm run rubro -- tecnologia build
```

## Un rubro nuevo

1. Copiá `papeleria.env` como `rubros/mi-rubro.env`.
2. Cambiá los valores (los comentarios explican cada uno).
3. `RUBRO=mi-rubro` en `.env.local` o en Vercel.

## Qué controla cada grupo de variables

- **MARCA_*** — nombre, rubro (el subtítulo del logo), lema, descripción para Google, la nota a mano, el
  resumen de tarjeta de Mercado Pago, el logo (`alas`, `inicial` o una imagen de `/public`), el dibujo de la
  portada (`alas`, `logo`, `ninguno` o una imagen) y la cabecera de los mails.
- **PORTADA_*** — el título grande de Inicio, la palabra resaltada, el texto y el bloque de destacados.
- **CATALOGO_*** — la dirección de la página de productos (`/papeleria`, `/menu`, `/tienda`…; la vieja redirige
  sola), su nombre, su encabezado y el texto del botón.
- **SECCIONES_ABIERTAS** — qué secciones existen: `descargables`, `personalizados`, `packs`, `ideas`, `listas`,
  `por-mayor`. Las que no estén no aparecen en ningún lado.
- **CONTACTO_*** — WhatsApp, mail, Instagram y TikTok (vacío = no se muestra).
- **COLOR_*** — 14 colores. Los más importantes: `COLOR_FONDO` (fondo de página), `COLOR_TEXTO` (texto, bordes y
  pie), `COLOR_PRINCIPAL` (portada y logo), `COLOR_PRINCIPAL_FUERTE` (links y botones) y `COLOR_ACENTO` (los
  resaltes y el botón de la portada, con texto en principal fuerte encima).
- **FUENTE_*** — cualquier familia de Google Fonts, escrita igual que en fonts.google.com. `FUENTE_MANO` vacía
  usa la de etiquetas en cursiva. `TITULOS_MAYUSCULAS` y `TEXTO_ESCALA` ajustan los títulos y el tamaño general.
- **ESTILO_*** — radios de esquinas, grosor de línea, tipo de sombra (`sello`, `suave`, `ninguna`), el patrón
  dibujado de la portada y el ancho máximo.

Cómo funciona por dentro: `next.config.ts` lee el rubro y lo pasa como `env`; `lib/marca.ts` lo ordena;
`lib/tema.ts` lo convierte en las variables CSS de `marca/tokens.css` y en los links de Google Fonts
(lo inserta `app/layout.tsx`). El CSS de `app/sitio.css` no tiene ningún valor de marca fijo.

## Lo que conviene revisar a mano en cada rubro

- **Textos largos**: Sobre nosotras, Preguntas frecuentes y Términos todavía hablan de papelería (con el nombre
  de la tienda ya cambiado). Reescribilos para el rubro nuevo.
- **"Bolsita"**: el carrito se llama así en todo el sitio.
- **Dibujos de producto**: los productos sin foto usan dibujos de papelería (`lib/productos.tsx`); en otros
  rubros conviene cargar fotos desde el panel.
- **Supabase, Mercado Pago, Gmail y Correo**: cada tienda necesita su propio proyecto y credenciales
  (ver `.env.example` y `supabase/LEEME.md`).
