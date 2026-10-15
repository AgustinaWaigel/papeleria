/* Lo que ve el panel mientras falten las variables de Supabase. */
export function SinSupabase() {
  return (
    <div className="admin__tarjeta prosa">
      <span className="nota-mano">falta un paso</span>
      <h1>Conectá Supabase</h1>
      <p>
        El panel guarda los productos en Supabase y todavía no encuentra los datos del proyecto. Mientras tanto, la tienda
        muestra el catálogo de <code>lib/productos.tsx</code>.
      </p>
      <ol>
        <li>
          Copiá <code>.env.example</code> como <code>.env.local</code> y completá la URL y la clave publicable.
        </li>
        <li>
          En Supabase → SQL Editor, corré <code>supabase/esquema.sql</code> y después <code>supabase/semilla.sql</code>.
        </li>
        <li>Creá tu usuario y sumá tu mail a la tabla de admins (está explicado al final de esquema.sql).</li>
        <li>Reiniciá el servidor de desarrollo.</li>
      </ol>
      <p>Paso a paso completo en <code>supabase/LEEME.md</code>.</p>
    </div>
  );
}
