"use server";

/*
  ACTIONS : l'équipe (propriétaire seulement).

  Créer un membre délégué (il reçoit un e-mail pour choisir son mot de
  passe), changer son rôle, le retirer. Le propriétaire est revérifié ici,
  et le backend refuse de toute façon à tout autre rôle.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminUser, createTeamMember, actOnTeamMember } from "@/lib/medusa/admin";

const PAGE = "/dashboard/admin/equipe";

function done(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params).toString()}`);
}

async function owner() {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");
  if (user.role !== "owner") done({ erreur: "Réservé au propriétaire." });

  return user;
}

export async function createMemberAction(formData: FormData) {
  await owner();

  const result = await createTeamMember({
    email: String(formData.get("email") || "").trim(),
    first_name: String(formData.get("first_name") || "").trim(),
    last_name: String(formData.get("last_name") || "").trim(),
    role: String(formData.get("role") || ""),
  });

  if (!result.ok) done({ erreur: result.reason });

  revalidatePath(PAGE);
  done({ fait: "Membre créé. Il reçoit un e-mail pour choisir son mot de passe." });
}

export async function memberActionAction(formData: FormData) {
  await owner();

  const id = String(formData.get("id") || "");
  const action = String(formData.get("action") || "");

  const result = await actOnTeamMember(id, { action, role: String(formData.get("role") || "") });

  if (!result.ok) done({ erreur: result.reason });

  revalidatePath(PAGE);
  done({ fait: action === "remove" ? "Membre retiré." : "Rôle modifié." });
}
