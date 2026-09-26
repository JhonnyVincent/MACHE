"use server";

/*
  ACTIONS : geler et dégeler les versements d'une boutique.

  Geler arrête l'ARGENT ; suspendre arrête la VENTE. Ce sont deux
  décisions, et elles se prennent séparément — on peut vouloir retenir
  les sommes d'une boutique qui continue d'honorer ses commandes.

  Les deux gestes exigent un motif, pour la même raison : six mois plus
  tard, un gel sans motif est une accusation que personne ne sait plus
  justifier, et un dégel sans motif est un argent reparti sans que
  personne sache pourquoi.

  La session est revérifiée ici : entre l'affichage de la page et le
  clic, elle a pu expirer, et une décision qui retient de l'argent ne
  doit pas s'exécuter sur une session qu'on n'a plus.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminUser, setPayoutFreeze } from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const PAGE = "/dashboard/admin/gel-des-versements";

function done(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params).toString()}`);
}

export async function setPayoutFreezeAction(formData: FormData) {
  const sellerId = String(formData.get("seller_id") || "").trim();
  const freeze = String(formData.get("freeze") || "") === "true";
  const reason = String(formData.get("reason") || "").trim();

  if (!sellerId) done({ erreur: "Boutique manquante." });

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  try {
    const result = await setPayoutFreeze({ sellerId, freeze, reason });

    if (!result.ok) done({ erreur: result.reason });

    revalidatePath(PAGE);

    if (!freeze) {
      done({
        fait: "Gel levé. Les livraisons confirmées à partir de maintenant porteront de nouveau leur somme comme due.",
      });
    }

    /*
      Le nombre de versements repris est dit, pas tu : c'est la mesure
      de ce que le gel vient d'attraper, et c'est ce qu'on veut savoir
      juste après avoir cliqué.
    */
    done({
      fait:
        result.data.pulledBack > 0
          ? `Versements gelés. ${result.data.pulledBack} livraison${result.data.pulledBack > 1 ? "s" : ""} déjà autorisée${result.data.pulledBack > 1 ? "s" : ""} ${result.data.pulledBack > 1 ? "ont" : "a"} été reprise${result.data.pulledBack > 1 ? "s" : ""} en retenue.`
          : "Versements gelés. Aucune livraison n'était en attente de versement.",
    });
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }
}
