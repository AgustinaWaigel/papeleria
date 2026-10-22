import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
for (const t of ["admins","categorias","productos","zonas_envio"]) { const { count, error } = await s.from(t).select("*", { count: "exact", head: true }); console.log(t, error ? error.message : count); }
const { data } = await s.auth.admin.listUsers(); console.log("usuarios auth:", data?.users?.length);
