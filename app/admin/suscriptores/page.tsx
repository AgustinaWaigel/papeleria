import type { Metadata } from "next";
import { Suspense } from "react";
import { borrarSuscriptor } from "../tienda-acciones";
import { BotonConfirmar } from "@/components/admin/BotonConfirmar";
import { CopiarMails } from "@/components/admin/CopiarMails";
import { FormRegalo } from "@/components/admin/FormRegalo";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { exigirAdmin } from "@/lib/admin";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Suscriptores" };

async function Contenido() {
  const { supabase } = await exigirAdmin();
  const [{ data, error }, { data: ajustes, error: sinRegalo }, { data: descargables }] = await Promise.all([
    supabase.from("suscriptores").select("email, creado_en").order("creado_en", { ascending: false }),
    supabase.from("ajustes").select("regalo_producto").maybeSingle(),
    supabase.from("productos").select("id, nombre").eq("tipo", "descargable").not("archivo", "is", null).order("nombre"),
  ]);
  const suscriptores = data ?? [];

  return (
    <>
      <div className="admin__encabezado">
        <div>
          <span className="nota-mano">quienes quieren novedades</span>
          <h1>Suscriptores</h1>
        </div>
        {suscriptores.length > 0 && <CopiarMails mails={suscriptores.map((s) => s.email)} />}
      </div>
      {error && <p className="admin__error">No se pudieron leer: {error.message}. ¿Corriste supabase/02-pedidos-y-mas.sql?</p>}
      <p className="campo__ayuda mb-e5">
        Se anotan desde el pie de la tienda. Para mandarles algo, copiá los mails y pegalos en CCO (copia oculta) de tu
        correo, o importalos en un servicio como Mailchimp o Brevo.
      </p>
      {/* Sin supabase/11-muestras-regalo-fotos-presupuestos.sql la columna no existe: no se muestra. */}
      {!sinRegalo && (
        <FormRegalo
          descargables={(descargables ?? []).map((d) => [d.id as string, d.nombre as string])}
          actual={ajustes?.regalo_producto ?? null}
        />
      )}
      <div className="admin__tabla-marco">
        <table className="admin__tabla">
          <thead>
            <tr>
              <th scope="col">Mail</th>
              <th scope="col">Desde</th>
              <th scope="col">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {suscriptores.map((s) => (
              <tr key={s.email}>
                <td>{s.email}</td>
                <td>{new Date(s.creado_en).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</td>
                <td>
                  <form action={borrarSuscriptor} className="admin__acciones">
                    <input type="hidden" name="email" value={s.email} />
                    <BotonConfirmar pregunta={`¿Sacar a ${s.email} de la lista?`}>Sacar</BotonConfirmar>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {suscriptores.length === 0 && <p className="admin__vacio">Todavía no se anotó nadie.</p>}
      </div>
    </>
  );
}

export default function Suscriptores() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <Suspense fallback={<p className="admin__cargando">Abriendo la libreta de contactos…</p>}>
      <Contenido />
    </Suspense>
  );
}
