"use server";

/*
  ACTION : changement de rôle d'un compte.

  Réservée au super administrateur, revérifié en base. Trois garde-fous
  volontaires :

  - `super_admin` n'est pas attribuable ici. Leur nombre est plafonné et
    cette décision se prend en base, délibérément ;
  - on ne retire pas son rôle à un super administrateur depuis un écran ;
  - un super administrateur ne peut pas modifier son propre rôle : c'est
    la façon la plus simple de se verrouiller hors de l'administration.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminForWrite, ASSIGNABLE_ROLES } from "@/lib/admin";

const BASE = "/dashboard/admin/users";

function fail(message: string): never {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`);
}

export async function setUserRoleAction(formData: FormData) {
  const { supabase, uid } = await requireAdminForWrite(BASE, true);

  const targetId = String(formData.get("user_id") || "");
  const role = String(formData.get("role") || "");

  if (!targetId) fail("Compte inconnu.");

  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
    fail("Ce rôle ne peut pas être attribué depuis cet écran.");
  }

  if (targetId === uid) {
    fail("Vous ne pouvez pas modifier votre propre rôle.");
  }

  const { data: target } = await supabase
    .from("users")
    .select("id, role, email")
    .eq("id", targetId)
    .maybeSingle();

  if (!target) fail("Ce compte n'existe plus.");

  if (String(target.role) === "super_admin") {
    fail("Le rôle d'un super administrateur ne se modifie pas depuis cet écran.");
  }

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", targetId);

  if (error) fail(error.message);

  revalidatePath(BASE);
  redirect(`${BASE}?success=role`);
}
