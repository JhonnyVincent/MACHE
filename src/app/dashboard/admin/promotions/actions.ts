"use server";

/*
  ACTION : déclarer qui paie une promotion.

  Ce que ce seul champ décide

  Il ne change rien à ce que l'acheteur voit ni à ce qu'il paie. Il
  décide de qui sort l'argent :

  - « le vendeur » : la remise sort de son chiffre d'affaires, MACHÉ
    garde sa commission entière ;
  - « MACHÉ » : la remise entière est retirée de la commission de
    MACHÉ, et le vendeur touche ce qu'il aurait touché sans promotion ;
  - « partagé » : chacun sa part, au pourcentage indiqué.

  Il s'applique aux commandes À VENIR

  Les commissions déjà calculées ne bougent pas : elles sont
  enregistrées, pas recalculées à la lecture. Changer le porteur
  aujourd'hui ne rembourse pas les commandes d'hier — et c'est
  volontaire, sans quoi une modification rétroactive ferait varier des
  sommes déjà facturées. L'écran le dit.

  La session est revérifiée ici : entre l'affichage de la page et le
  clic, elle a pu expirer, et une décision qui engage de l'argent ne
  doit pas s'exécuter sur une session qu'on n'a plus.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminUser, setPromotionCostBearer } from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const PAGE = "/dashboard/admin/promotions";

function done(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params).toString()}`);
}

export async function setCostBearerAction(formData: FormData) {
  const promotionId = String(formData.get("promotion_id") || "");
  const bearer = String(formData.get("cost_bearer") || "");
  const percentage = String(formData.get("shared_percentage") || "");

  if (!promotionId) done({ erreur: "Promotion manquante." });

  if (bearer !== "store" && bearer !== "marketplace" && bearer !== "shared") {
    done({ erreur: "Porteur du coût inconnu." });
  }

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  try {
    const result = await setPromotionCostBearer({
      promotionId,
      costBearer: bearer as "store" | "marketplace" | "shared",
      sharedPercentage: percentage ? Number(percentage) : null,
    });

    if (!result.ok) done({ erreur: result.reason });

    revalidatePath(PAGE);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    done({ erreur: reasonOf(error) });
  }

  done({
    fait:
      bearer === "marketplace"
        ? "Promotion à la charge de MACHÉ. Sur les prochaines commandes, la remise sera retirée de la commission et le vendeur touchera comme s'il n'y avait pas eu de promotion."
        : bearer === "shared"
          ? `Promotion partagée : MACHÉ en portera ${Number(percentage)} % sur les prochaines commandes.`
          : "Promotion à la charge du vendeur. La commission de MACHÉ reste entière.",
  });
}
