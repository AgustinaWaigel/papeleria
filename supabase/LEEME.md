# Conectar la tienda con Supabase

La tienda lee los productos de Supabase y el panel (`/admin`) los edita. Sin conexión, todo sigue andando con el catálogo de `lib/productos.tsx`.

## 1. Crear el proyecto

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo.
2. En **Project Settings → API** copiá la **URL** y la **Publishable key** (o la *anon key* si tu proyecto es viejo).
3. En la raíz del proyecto, copiá `.env.example` como `.env.local` y pegá esos dos valores.

## 2. Crear la tabla y las reglas

En **SQL Editor → New query**:

1. Pegá todo `esquema.sql` y tocá **Run**. Crea la tabla `productos`, la tabla `admins`, las reglas de acceso y el bucket `productos` para las fotos.
2. Pegá `02-pedidos-y-mas.sql` y tocá **Run**. Suma pedidos y ventas, stock, ofertas, categorías editables, reseñas y suscriptores.
   Después, `04-pagos-online.sql` (pago con Mercado Pago, seguimiento de pedidos y PDFs de los descargables) y `05-mail-descargables.sql` (el mail con los PDF). Ver *Pago online* y *Mail con los PDF* más abajo.
3. Si alguna vez corriste `semilla.sql` (los productos de ejemplo), pegá `03-borrar-ejemplos.sql` y tocá **Run** para sacarlos. `semilla.sql` ya no hace falta.

Los productos reales se cargan desde el panel, uno por uno o todos juntos con un Excel (en *Productos → Cargar o descargar productos con Excel*). Mientras no haya ninguno, la tienda muestra un aviso de "estamos fabricando".

## 3. Tu usuario del panel

1. **Authentication → Users → Add user → Create new user**, con tu mail y una contraseña. Tildá *Auto Confirm User*.
2. En el SQL Editor corré, con tu mail:

   ```sql
   insert into public.admins (email) values ('tu-mail@ejemplo.com');
   ```

   Solo los mails de esa tabla pueden editar. Para sumar a alguien más, repetí los dos pasos con su mail.
3. Recomendado: en **Authentication → Sign In / Providers** apagá *Allow new users to sign up*, así nadie crea cuentas desde afuera.

## 4. Probar

Reiniciá `npm run dev` (las variables de entorno se leen al arrancar) y entrá a `http://localhost:3000/admin`.

Los cambios que guardes se ven en la tienda al instante: el panel invalida la caché del catálogo cada vez que guarda.

## Cómo funcionan los pedidos y el stock

- **Pedidos de la web:** cuando alguien toca "Enviar pedido por WhatsApp", el pedido queda guardado como *Sin confirmar*, con un código (AA-XXXXX) que también va en el mensaje. Así lo encontrás en el chat.
- **Ventas directas:** en *Pedidos y ventas → Registrar una venta* cargás lo que vendés en persona, por Instagram o en una feria (código V-XXXXX). Podés cambiar el precio si hiciste un descuento.
- **Stock:** baja solo cuando un pedido pasa a *Pagado*, *Enviado* o *Entregado*, y vuelve si lo cancelás o lo borrás. Un producto con el stock vacío no se controla.

## Pago online con Mercado Pago

La bolsita ofrece dos caminos: **pagar con Mercado Pago** o **pedir por WhatsApp** (como siempre). El pago online aparece solo cuando están configuradas las dos claves de abajo.

1. En el SQL Editor corré `04-pagos-online.sql`. Suma los datos de quien compra, el envío, el pago, el link de seguimiento y el bucket privado `descargables` para los PDFs.
2. En Supabase, **Project Settings → API Keys**, copiá la **Secret key** y pegala en `.env.local` como `SUPABASE_SECRET_KEY`. Es secreta: no la compartas ni la subas a GitHub.
3. En [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app), **Crear aplicación** (tipo *Pagos online*, *Checkout Pro*). En **Credenciales de prueba** copiá el *Access Token* y pegalo como `MERCADOPAGO_ACCESS_TOKEN`.
4. Reiniciá `npm run dev`.

**Probar sin plata real:** con las credenciales de prueba, en *Cuentas de prueba* creá un comprador de prueba y pagá con las [tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards) (con el nombre `APRO` sale aprobado, con `OTHE` rechazado). Al volver a la tienda, la página del pedido le pregunta a Mercado Pago cómo salió el pago, así que funciona también en `localhost`.

**Cobrar de verdad:** cambiá `MERCADOPAGO_ACCESS_TOKEN` por el de **Credenciales de producción** (en Vercel: *Settings → Environment Variables*, junto con `SUPABASE_SECRET_KEY`) y volvé a publicar. En producción Mercado Pago avisa solo a `/api/mercadopago` cada vez que un pago cambia, aunque quien compró no vuelva a la tienda.

**Cómo funciona:**

- Quien compra completa nombre, mail, WhatsApp y cómo lo recibe (retiro o envío; si es todo descargable, no se pregunta). Los precios salen de la base y, si algo no tiene stock, no deja pagar.
- Paga en Mercado Pago y vuelve a **su página de seguimiento** (`/pedido/AA-XXXXX?clave=…`): ve qué compró, el estado del pago, los pasos del pedido y el número de envío cuando lo cargues.
- Cuando el pago se aprueba, el pedido pasa solo a **Pagado** y se descuenta el stock. Lo demás (enviado, entregado) lo cambiás vos desde el panel, y el cliente lo ve en su página.
- **Descargables:** en el producto subís el PDF (o un .zip, hasta 50 MB). Queda en privado y le llega por mail a quien pagó (ver abajo).
- En el panel, cada pedido tiene **Copiar link de seguimiento**: sirve también para los pedidos de WhatsApp y las ventas a mano.

## Mail con los PDF

Cuando un pedido con descargables queda pagado (por Mercado Pago, o porque lo pasás a *Pagado* en el panel), a quien compró le llega un mail con los PDF adjuntos. Si pesan más de lo que Gmail deja adjuntar, van como link dentro del mismo mail (dura 7 días). Se manda una sola vez; en el panel, el pedido muestra cuándo salió y tiene **Reenviar los PDF por mail**.

1. En el SQL Editor corré `05-mail-descargables.sql`.
2. En la cuenta de Google de la tienda, activá la **verificación en dos pasos** (*Cuenta de Google → Seguridad*).
3. Entrá a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), creá una contraseña con el nombre "Tienda" y copiá las 16 letras.
4. En `.env.local` (y en Vercel) poné `GMAIL_USUARIO` con el mail de la tienda y `GMAIL_CLAVE_APP` con esas 16 letras. Reiniciá `npm run dev`.

Para un pedido de WhatsApp o una venta a mano, cargá el mail del cliente en *Cliente y pago* **antes** de pasarlo a *Pagado* (o después, y tocá *Mandar los PDF por mail*).

## Envíos, cupones, mails automáticos y botón de arrepentimiento

Corré `07-envios-cupones-y-mas.sql` en el SQL Editor. Suma:

- **Envíos por zona** (panel → *Envíos*): quien paga online pone su código postal (la provincia se completa sola) y ve el costo de su zona antes de pagar; lo paga junto con el pedido. Vienen zonas pensadas para despachar desde Crespo: Crespo con precio fijo de $ 3.000 (lo llevás vos; no se cotiza con el correo), y Paraná, resto de Entre Ríos, Litoral, CABA/Buenos Aires/Córdoba y resto del país sin precio: cargalos mirando las tarifas de tu correo y actualizalos cuando suban. Una zona puede tener provincias y códigos postales puntuales (estos ganan). Sin precio, usa el *costo por defecto*; sin ninguno, se coordina por WhatsApp. También: desde cuánto es gratis y un texto para quien compra.
- **Cupones** (panel → *Cupones*): porcentaje o monto fijo, con compra mínima, vencimiento y cantidad de usos opcionales. Se escriben en la página de compra, antes de pagar. Para el límite de usos cuentan los pedidos pagados y los que se están pagando: el uso queda reservado 30 minutos, y el link de pago de un pedido con cupón vence en ese rato.
- **Mails automáticos** (con Gmail configurado, ver arriba): al cliente le llegan *Recibimos tu compra* cuando queda pagado, *Tu pedido está en camino* o *Listo para retirar* cuando lo pasás a *Enviado* (cargá antes el número de seguimiento) y los PDF de los descargables. A vos te llega un aviso por cada venta online (a `MAIL_AVISOS`, o a la misma casilla de Gmail). En cada pedido, *Mails al cliente* muestra cuáles salieron y deja reenviarlos.
- **Avisame cuando vuelva**: en un producto agotado, quien quiera deja su mail; cuando le cargás stock desde el panel (o el Excel), le llega un aviso.
- **Botón de arrepentimiento** (obligatorio, Res. 424/2020): está en el pie de todas las páginas. Quien lo usa recibe un código de trámite al instante y por mail; a vos te llega un aviso y lo ves en el panel → *Arrepentimientos*. Hay que responder dentro de las 24 horas.
- **Términos y condiciones** y **Privacidad**: páginas en el pie. Conviene que las lea alguien de confianza y sumar tus datos fiscales.

### Cotización en vivo con Correo Argentino (opcional)

Con la API **MiCorreo**, quien compra ve el precio real de Correo Argentino para su código postal (el servicio a domicilio más barato, más tu recargo). Si el correo no responde, se usa el precio de la zona: la venta nunca se traba.

1. Necesitás una cuenta en [MiCorreo](https://www.correoargentino.com.ar/MiCorreo/public/) y **credenciales de la API**, que Correo Argentino da a pedido desde el [formulario de contacto](https://www.correoargentino.com.ar/MiCorreo/public/contact). Pedí las de **prueba** y las de **producción** (son distintas).
2. En `.env.local` (y en Vercel): `CORREO_AMBIENTE` (`prueba` o `produccion`), `CORREO_API_USUARIO`, `CORREO_API_CLAVE`, `CORREO_MICORREO_EMAIL` y `CORREO_MICORREO_CLAVE`. Si despachás desde otro lado que no sea Crespo, `CORREO_CP_ORIGEN`.
3. En el panel → *Envíos* → *Correo Argentino*: las medidas de tu caja, el peso por defecto y el recargo. Tocá **Probar cotización** con un código postal para ver que ande.
4. En cada producto físico cargá el **peso en gramos** (ya envuelto).

La API **Paq.ar 2.0** (la de "agreement" y "API-Key") es otra cosa: es para clientes con contrato comercial y sirve para crear envíos e imprimir rótulos, no para cotizar.

**Orden de los scripts:** `05` y `07` antes de publicar esta versión; `06-seguridad.sql`, después.

### Seguridad del pago online

Corré `08-seguridad-pagos.sql` **antes** de publicar la versión con la página de compra (`/comprar`): sin él, el pago online no arma pedidos. Hace que el pedido online solo lo pueda crear el servidor de la tienda (así nadie se saltea la cotización del envío), que un envío sin precio no se pueda pagar online y que los cupones con límite de usos no se puedan usar en varios pedidos a la vez.

## Secciones y etiquetas

Corré `09-secciones-y-etiquetas.sql` en el SQL Editor **antes** de publicar la versión que lo usa (sin la columna `etiquetas`, la tienda no puede leer el catálogo). Suma:

- **Etiquetas** en cada producto (al editarlo, en *Secciones y etiquetas*, o en la columna *Etiquetas* del Excel, separadas por comas). Se ven en la página del producto, cada una con su página (`/seccion/vuelta-al-cole`), y cuentan para el buscador.
- **Secciones** (panel → *Secciones*): etiquetas que van en el menú *Productos* de la cabecera y en Inicio. Vienen *Escuela*, *Emprendedores* y *Digitales*. Una sección junta todos los productos con su etiqueta, sean de papelería o descargables, y no aparece mientras no tenga ninguno.

## Precio por cantidad (x10, x20…)

Corré `10-precio-por-cantidad.sql` después del `09` y **antes** de publicar la versión que lo usa. En cada producto aparece *Precio por cantidad*: ponés desde cuántas unidades y qué porcentaje descuenta cada una (por ejemplo, desde 10, 10 % off; desde 20, 15 % off). En el Excel va en la columna *Por cantidad* como `10: 10%, 20: 15%`.

- En la página del producto se elige x1, x10, x20… y se ve lo que sale cada uno y cuánto se ahorra. En la bolsita, cada renglón muestra el descuento y un atajo para llegar al siguiente.
- El descuento lo calcula la base al armar el pedido (por WhatsApp o pagando online), así que no se puede cambiar desde el navegador. El cupón se aplica después, sobre el total con el descuento.
- El máximo por producto pasa de 99 a 999 unidades.
- En *Registrar una venta* el precio lo ponés vos: si vendés de a muchos en persona, cargá el precio con el descuento.

## Muestras, regalo, fotos de clientas y pedidos por mayor

Corré `11-muestras-regalo-fotos-presupuestos.sql` después del `10` y **antes** de publicar la versión que lo usa. Suma:

- **Páginas de muestra** (en cada producto, *Páginas de muestra*): fotos de las hojas de adentro. En la tienda aparecen como *Mirá por dentro* y se abren enteras. Conviene mostrar una parte o ponerles marca de agua.
- **PDF o editable en Canva** (en cada descargable, *Formato*): cargá cada formato como un producto aparte, con su precio y su PDF, y unilos en *El mismo producto en el otro formato*. En la tienda, la página del producto muestra los dos formatos con su precio para elegir, y el catálogo muestra uno solo («También editable en Canva»). El PDF del de Canva es una hoja con el botón al *Enlace de plantilla* de Canva (*Compartir → Enlace de plantilla*) y las instrucciones.
- **Regalo al anotarse** (panel → *Suscriptores*): elegís un descargable con PDF cargado. A quien se suscribe le llega por mail con un botón para bajarlo (no vence) y el formulario del pie lo anuncia. Necesita el mail de Gmail configurado.
- **Así lo usan** (panel → *Así lo usan*): fotos de clientas, con su usuario y el producto que se ve. Salen en la página del producto y en Inicio. Pedí permiso antes de subirlas.
- **Pedidos por mayor** (`/pedidos-por-mayor`, panel → *Presupuestos*): emprendimientos, escuelas y eventos piden presupuesto. Reciben un número al instante y un mail; a vos te llega un aviso.

Sin base de datos también hay dos cosas nuevas: **Personalizados**, que ya está abierta (`ABIERTAS.personalizados` en `lib/paginas.ts`), y **Listas escolares** (`/listas-escolares`: se pega la lista de útiles y se arma la bolsita), que está hecha pero guardada para más adelante: para abrirla, poné `listas: true` en `ABIERTAS`.

**Orden de los scripts nuevos:** `09`, `10` y `11`, en ese orden y antes de publicar. Sin el `09` y el `10` la tienda no ve el catálogo; sin el `11`, tampoco (pide la columna `muestras`).

## En producción

Cargá las mismas dos variables (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) en tu hosting antes de hacer el build: también configuran qué dominio de imágenes acepta `next/image`. Sumá `NEXT_PUBLIC_SITIO_URL` con tu dominio (por ejemplo `https://www.alasdeangel.com.ar`) para que el sitemap y los links que se comparten apunten bien; en Vercel se toma solo.
