"use server";

/*
  ACTIONS : suspendre, rétablir, résilier une boutique.

  POURQUOI AUCUNE NE SUPPRIME

  Supprimer un vendeur emporterait ses commandes passées et les
  commissions qu'il doit à MACHÉ. Mercur propose deux états qui
  préservent l'historique comptable, et ce sont eux qu'on utilise :

  - SUSPENDRE : réversible. La boutique ne vend plus, elle peut revenir.
  - RÉSILIER : met fin à la relation.

  Ils sont présentés par deux boutons distincts, jamais par un menu
  déroulant : on ne résilie pas en croyant suspendre.

  LE MOTIF EST DEMANDÉ, MÊME SI MERCUR LE REND FACULTATIF

  Six mois plus tard, une boutique suspendue sans motif est une
  décision que plus personne ne sait justifier — ni défendre si le
  vendeur la conteste.
*/

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  getAdminUser,
  suspendSeller,
  unsuspendSeller,
  terminateSeller,
  unterminateSeller,
} from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const BACK = "/dashboard/admin/stores";

function done(params: Record<string, string>): never {
  redirect(`${BACK}?${new URLSearchParams(params).toString()}`);
}

/*
  Le catalogue change : une boutique suspendue disparaît du site. Sans
  invalidation de l'ÉTIQUETTE — et pas seulement des chemins — elle y
  resterait visible jusqu'à expiration du cache, et on croirait la
  suspension sans effet. C'est l'erreur déjà faite sur l'approbation.
*/
function refreshCatalogue() {
  revalidateTag("sellers");
  revalidateTag("products");

  revalidatePath("/shop");
  revalidatePath("/gros");
  revalidatePath("/");
  revalidatePath(BACK);
}

export async function suspendSellerAction(formData: FormData) {
  const sellerId = String(formData.get("seller_id") || "");
  const reason = String(formData.get("reason") || "").trim();
  const mode = String(formData.get("mode") || "suspend");

  if (!sellerId) done({ erreur: "Boutique manquante." });

  /*
    La session est revérifiée ici, et pas seulement à l'affichage de la
    page : entre le rendu et le clic, elle a pu expirer — et une action
    qui suspend une boutique ne doit pas s'exécuter sur une session
    qu'on n'a plus.
  */
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  if (reason.length < 5) {
    done({
      erreur:
        "Dites en une phrase pourquoi. Sans motif, cette décision sera indéfendable dans six mois.",
    });
  }

  try {
    const result =
      mode === "terminate"
        ? await terminateSeller(sellerId, reason)
        : await suspendSeller(sellerId, reason);

    if (!result.ok) done({ erreur: result.reason });

    refreshCatalogue();
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }

  done({
    fait:
      mode === "terminate"
        ? "Boutique résiliée. Ses commandes et les commissions dues sont conservées."
        : "Boutique suspendue. Elle ne vend plus et n'apparaît plus sur le site.",
  });
}

export async function restoreSellerAction(formData: FormData) {
  const sellerId = String(formData.get("seller_id") || "");
  const mode = String(formData.get("mode") || "suspend");

  if (!sellerId) done({ erreur: "Boutique manquante." });

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  try {
    const result =
      mode === "terminate"
        ? await unterminateSeller(sellerId)
        : await unsuspendSeller(sellerId);

    if (!result.ok) done({ erreur: result.reason });

    refreshCatalogue();
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }

  done({ fait: "Boutique rétablie." });
}
