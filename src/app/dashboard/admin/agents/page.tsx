/*
  PAGE : Agents.

  Cet écran lisait ses données dans Supabase, dont le projet a été
  supprimé. Il le dit, au lieu de lever une erreur serveur comme il le
  faisait — « Application error », sans rien indiquer de la cause.
*/

import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/medusa/admin";
import { StaffOnSupabase } from "@/components/staff-on-supabase";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  return (
    <StaffOnSupabase
      area="Agents"
      what="Les agents MACHÉ vérifient les livraisons et confirment les remises en main propre."
    />
  );
}
