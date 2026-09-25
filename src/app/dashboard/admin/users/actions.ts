"use server";

/*
  ACTION : bloquer ou débloquer un compte client.

  CE QUE LE BLOCAGE FAIT

  Il empêche CE COMPTE d'agir : commander en étant connecté, déposer un
  avis, écrire à MACHÉ, se servir de l'espace agent. Le backend refuse
  toute écriture faite avec sa session ; la lecture de son propre
  historique reste possible, ce qui compte pour régler un litige en
  cours.

  CE QU'IL NE FAIT PAS

  Il n'empêche pas la PERSONNE de revenir : on peut acheter sans compte,
  et rien n'interdit d'en créer un autre. L'écran le dit — promettre une
  barrière qui n'existe pas est pire que ne rien promettre, parce qu'on
  cesse alors de surveiller.

  RIEN N'EST SUPPRIMÉ

  Un compte effacé emporterait ses commandes, et avec elles les
  commissions dues à MACHÉ.

  La session est revérifiée ici : entre l'affichage de la page et le
  clic, elle a pu expirer.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminUser, setCustomerBlocked } from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const PAGE = "/dashboard/admin/users";

function done(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params).toString()}`);
}

export async function setCustomerBlockedAction(formData: FormData) {
  const customerId = String(formData.get("customer_id") || "").trim();
  const blocked = String(formData.get("blocked") || "") === "true";
  const term = String(formData.get("q") || "").trim();

  if (!customerId) done({ erreur: "Compte manquant." });

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  try {
    const result = await setCustomerBlocked(customerId, blocked);

    if (!result.ok) done({ ...(term ? { q: term } : {}), erreur: result.reason });

    revalidatePath(PAGE);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ ...(term ? { q: term } : {}), erreur: reasonOf(error) });
  }

  /*
    La recherche est reportée : sans cela, bloquer un compte ferait
    perdre la liste qu'on était en train d'examiner.
  */
  done({
    ...(term ? { q: term } : {}),
    fait: blocked
      ? "Compte bloqué. Il ne peut plus commander, déposer d'avis ni écrire à MACHÉ. Son historique reste lisible."
      : "Compte débloqué. Il peut de nouveau commander et écrire.",
  });
}
