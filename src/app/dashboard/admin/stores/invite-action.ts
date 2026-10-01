"use server";

/*
  ACTION : inviter un vendeur.

  Envoie un e-mail avec le lien d'inscription. Le vendeur crée lui-même
  son compte ; la boutique reste soumise à l'approbation.
*/

import { redirect } from "next/navigation";
import { getAdminUser, inviteSeller } from "@/lib/medusa/admin";

const PAGE = "/dashboard/admin/stores";

export async function inviteSellerAction(formData: FormData) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const result = await inviteSeller({
    email: String(formData.get("email") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    note: String(formData.get("note") || "").trim(),
  });

  redirect(`${PAGE}?${new URLSearchParams(result.ok ? { fait: "Invitation envoyée." } : { erreur: result.reason }).toString()}`);
}
