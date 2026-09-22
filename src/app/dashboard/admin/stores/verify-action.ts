"use server";

/*
  ACTION : accorder ou retirer la vérification d'une boutique.

  Approuver et vérifier sont deux décisions distinctes, et le site les
  confondait. Approuver ouvre la boutique à la vente. Vérifier affirme
  aux acheteurs que MACHÉ a contrôlé les documents de l'entreprise —
  c'est MACHÉ qui s'engage, pas le vendeur qui se présente.

  Le retrait existe autant que l'octroi. Une vérification qu'on ne peut
  pas retirer est une vérification qu'on n'ose plus accorder : il faut
  pouvoir se tromper, ou constater qu'une situation a changé.
*/

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAdminUser, setSellerVerified } from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";
import { reportOutage } from "@/lib/medusa/outage";

const BASE = "/dashboard/admin/stores";

export async function setVerifiedAction(formData: FormData) {
  try {
    /*
      La session est revérifiée ici. Une action serveur est une adresse
      comme une autre : s'en remettre au contrôle fait par la page
      laisserait accorder un badge de vérification à qui sait former la
      requête — c'est-à-dire exactement la chose que ce badge est censé
      empêcher.
    */
    const user = await getAdminUser();

    if (!user) redirect("/dashboard/admin/connexion");

    const sellerId = String(formData.get("seller_id") || "").trim();
    const verified = String(formData.get("verified") || "") === "1";

    if (!sellerId) {
      redirect(`${BASE}?error=${encodeURIComponent("Boutique introuvable.")}`);
    }

    const result = await setSellerVerified(sellerId, verified);

    if (!result.ok) {
      redirect(`${BASE}?error=${encodeURIComponent(result.reason)}`);
    }

    /*
      Le badge s'affiche sur la boutique, sur les fiches produit et sur
      la page des grossistes. Sans invalidation, il resterait invisible
      jusqu'à expiration du cache — on croirait la décision sans effet.
    */
    revalidateTag("sellers");
    revalidatePath("/gros");
    revalidatePath("/shop");
    revalidatePath("/");
    revalidatePath(BASE);

    redirect(`${BASE}?verifiee=${verified ? "1" : "0"}`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage("vérification boutique", reasonOf(error));

    redirect(
      `${BASE}?error=${encodeURIComponent(
        "La décision n'a pas pu être enregistrée. Réessayez dans quelques minutes."
      )}`
    );
  }
}
