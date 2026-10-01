"use server";

/*
  ACTIONS : accorder, refuser ou retirer un compte professionnel.

  Un compte professionnel donne accès aux grossistes et aux devis. Le
  refus exige un motif, qui part au client par e-mail : un refus sans
  explication ne se défend pas, et le client ne saurait pas quoi
  corriger. La session est revérifiée ici : entre l'affichage et le
  clic, elle a pu expirer.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminUser, actOnPro } from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const PAGE = "/dashboard/admin/pros";

function done(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params).toString()}`);
}

export async function proDecisionAction(formData: FormData) {
  const customerId = String(formData.get("customer_id") || "").trim();
  const action = String(formData.get("action") || "");
  const reason = String(formData.get("reason") || "").trim();

  if (!customerId) done({ erreur: "Client manquant." });
  if (!["approve", "refuse", "revoke"].includes(action)) done({ erreur: "Action inconnue." });

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  try {
    const result = await actOnPro(customerId, action as "approve" | "refuse" | "revoke", reason);

    if (!result.ok) done({ erreur: result.reason });

    revalidatePath(PAGE);
    revalidatePath("/gros");

    done({ fait: action });
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: `L'action n'a pas abouti : ${reasonOf(error)}` });
  }
}
