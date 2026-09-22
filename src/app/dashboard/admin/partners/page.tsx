/*
  PAGE : Partenaires.

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
      area="Partenaires"
      what="Les partenaires sont des prestataires de la marketplace — logistique, photo, comptabilité, import — rattachés à un ou plusieurs vendeurs."
    />
  );
}
