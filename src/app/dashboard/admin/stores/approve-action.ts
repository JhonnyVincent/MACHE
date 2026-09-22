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
import { revalidatePath, revalidateTag } from "next/cache";
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
    Le catalogue change : les produits de cette boutique y entrent, et
    la boutique elle-même apparaît. Sans invalidation, l'approbation
    reste invisible jusqu'à expiration du cache — on la croit sans
    effet, et on recommence.

    L'ÉTIQUETTE d'abord, et c'est elle qui manquait. Les listes de
    boutiques sont mises en cache sous « sellers » pendant deux
    minutes, indépendamment de la page qui les demande : invalider
    seulement des chemins laissait la boutique absente de l'accueil et
    de « Acheter en gros ». Constaté en approuvant une boutique
    déclarée grossiste, qui n'y figurait toujours pas.
  */
  revalidateTag("sellers");
  revalidateTag("products");

  revalidatePath("/shop");
  revalidatePath("/gros");
  revalidatePath("/");
  revalidatePath(back);

  redirect(`${back}?approuvee=1`);
}
