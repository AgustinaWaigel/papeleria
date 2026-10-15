import type { Metadata } from "next";
import { FormIngreso } from "@/components/admin/FormIngreso";
import { SinSupabase } from "@/components/admin/SinSupabase";
import { supabaseConfigurado } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Ingresar" };

export default function Ingresar() {
  if (!supabaseConfigurado) return <SinSupabase />;
  return (
    <div className="admin__tarjeta admin__ingreso">
      <span className="nota-mano">solo para el taller</span>
      <h1>Ingresar al panel</h1>
      <FormIngreso />
    </div>
  );
}
