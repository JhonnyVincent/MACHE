"use server";

/*
  ACTION : le vendeur déclare son profil.

  Quatre profils, ceux que présentent les pages /sell : particulier,
  business, fournisseur, marque. Ils ne changent pas les droits du
  vendeur — ils disent à l'acheteur à qui il a affaire.

  Ce que le navigateur envoie n'est pas pris tel quel : seuls les quatre
  identifiants déclarés sont acceptés. Une valeur inventée n'atteint pas
  la base, et n'atteint donc jamais la page publique d'une boutique.

  L'identité du vendeur ne vient pas du formulaire mais du cookie de
  session, vérifié par `saveSellerProfile`. Un vendeur ne peut pas
  modifier le profil d'un autre en changeant sa requête.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { saveSellerProfile } from "@/lib/medusa/vendor";
import { isSellerProfile, profileInfo } from "@/lib/seller-profile";

const BASE = "/dashboard/seller/profil";

export async function saveProfileAction(formData: FormData) {
  const choice = String(formData.get("profile") || "").trim();

  if (!isSellerProfile(choice)) {
    redirect(`${BASE}?error=${encodeURIComponent("Ce profil n'existe pas.")}`);
  }

  const saved = await saveSellerProfile(choice);

  if (!saved.ok) {
    redirect(`${BASE}?error=${encodeURIComponent(saved.reason)}`);
  }

  revalidatePath(BASE);
  /* La boutique publique doit refléter le changement immédiatement. */
  revalidatePath("/store/[slug]", "page");

  redirect(
    `${BASE}?success=${encodeURIComponent(
      `Profil enregistré : ${profileInfo(choice).label}.`
    )}`
  );
}
