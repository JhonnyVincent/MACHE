"use server";

/*
  ACTIONS : l'agent fait avancer un colis, ou confirme une remise.

  Ce que ces actions NE vérifient pas, et pourquoi c'est correct

  Elles ne vérifient ni l'habilitation de l'agent, ni que le colis lui
  appartient, ni que la transition demandée est permise. Le backend le
  fait, sur chaque appel, à partir de la session — pas du formulaire.

  Refaire ces contrôles ici donnerait deux jugements pour une seule
  question, et le jour où l'un des deux évoluerait seul, c'est le plus
  permissif qui déciderait. Un seul arbitre, côté serveur, où vit la
  donnée.

  Ce qui est vérifié ici : que le formulaire contient ce qu'il faut.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { advanceAgentDelivery, confirmAgentDelivery } from "@/lib/medusa/agent";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

function back(message: string, key: "error" | "success"): never {
  redirect(`/dashboard/agent?${key}=${encodeURIComponent(message)}`);
}

export async function advanceDeliveryAction(formData: FormData) {
  const id = String(formData.get("delivery_id") || "");
  const status = String(formData.get("next_status") || "");
  const reason = String(formData.get("reason") || "").trim();

  if (!id || !status) back("Colis ou étape manquante.", "error");

  try {
    const result = await advanceAgentDelivery(id, status, reason || undefined);

    if (!result.ok) back(result.reason, "error");

    revalidatePath("/dashboard/agent");
  } catch (error) {
    if (isControlFlow(error)) throw error;
    back(reasonOf(error), "error");
  }

  back("Colis mis à jour.", "success");
}

/*
  La saisie du code, celui que l'acheteur remet à la livraison.

  Le message d'erreur du backend est repris TEL QUEL, y compris le
  nombre d'essais restants. Le remplacer par un « code incorrect »
  générique priverait l'agent de la seule information qui compte
  lorsqu'il approche du plafond : après cinq erreurs, le colis se
  bloque et il faut appeler MACHÉ. Mieux vaut qu'il l'apprenne au
  quatrième essai qu'au sixième.
*/
export async function confirmDeliveryAction(formData: FormData) {
  const id = String(formData.get("delivery_id") || "");
  const code = String(formData.get("code") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!id) back("Colis manquant.", "error");

  if (!code) back("Demandez son code à l'acheteur, puis saisissez-le.", "error");

  try {
    const result = await confirmAgentDelivery(id, code, note || undefined);

    if (!result.ok) back(result.reason, "error");

    revalidatePath("/dashboard/agent");
  } catch (error) {
    if (isControlFlow(error)) throw error;
    back(reasonOf(error), "error");
  }

  back("Remise confirmée. Le colis est marqué livré.", "success");
}
