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

## En producción

Cargá las mismas dos variables (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) en tu hosting antes de hacer el build: también configuran qué dominio de imágenes acepta `next/image`. Sumá `NEXT_PUBLIC_SITIO_URL` con tu dominio (por ejemplo `https://www.alasdeangel.com.ar`) para que el sitemap y los links que se comparten apunten bien; en Vercel se toma solo.
