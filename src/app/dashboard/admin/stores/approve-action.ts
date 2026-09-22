"use server";

/*
  ACTION : approuver une boutique.

  Tant qu'une boutique n'est pas approuvée, ses produits n'apparaissent
  pas dans le catalogue — et son propriétaire, lui, attend sans savoir
  quoi. C'est la raison d'être de ce bouton.

  L'approbation passe par la route de Mercur, qui exécute son propre
  workflow : cette page et le panneau du backend font le même geste, et
  ne peuvent pas diverger.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { approveSeller, getAdminUser } from "@/lib/medusa/admin";

export async function approveSellerAction(formData: FormData) {
  /*
    La session est revérifiée ici. Une action serveur est une adresse
    comme une autre : s'en remettre au contrôle fait par la page
    laisserait approuver une boutique à qui sait former la requête.
  */
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const sellerId = String(formData.get("seller_id") || "").trim();

  const back = "/dashboard/admin/stores";

  if (!sellerId) {
    redirect(`${back}?error=${encodeURIComponent("Boutique introuvable.")}`);
  }

  const result = await approveSeller(sellerId);

  if (!result.ok) {
    redirect(`${back}?error=${encodeURIComponent(result.reason)}`);
  }

  /*
    Le catalogue change : les produits de cette boutique y entrent. Les
    pages qui le lisent doivent être relues, sinon l'approbation reste
    invisible jusqu'à expiration du cache.
  */
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(back);

  redirect(`${back}?approuvee=1`);
}
