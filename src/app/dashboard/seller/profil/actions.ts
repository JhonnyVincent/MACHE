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
import { sanitizeMinimum } from "@/lib/seller-minimum";
import { isThemeId, themeById } from "@/lib/storefront/themes";
import { saveSellerMinimum, saveSellerTheme } from "@/lib/medusa/vendor";

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

/*
  ACTION : la commande minimum de la boutique.

  Zéro veut dire « pas de minimum », et c'est le cas de la plupart des
  commerces : vendre à qui veut, quelle que soit la somme, est la règle.
  Un champ vide enregistre donc zéro plutôt que d'être refusé.
*/
export async function saveMinimumAction(formData: FormData) {
  const amount = sanitizeMinimum(formData.get("min_order"));

  const saved = await saveSellerMinimum(amount);

  if (!saved.ok) {
    redirect(`${BASE}?error=${encodeURIComponent(saved.reason)}`);
  }

  revalidatePath(BASE);
  revalidatePath("/store/[slug]", "page");
  revalidatePath("/cart");

  redirect(
    `${BASE}?success=${encodeURIComponent(
      amount > 0
        ? `Commande minimum enregistrée : ${amount.toLocaleString("fr-FR")} HTG.`
        : "Commande minimum retirée : vous vendez sans montant minimum."
    )}`
  );
}

/*
  ACTION : le thème de la vitrine.

  Seuls les identifiants de la liste sont acceptés. Ce n'est pas une
  précaution de principe : ce que le navigateur envoie finit en
  variables CSS sur une page publique, et la liste fermée est ce qui
  garantit qu'une vitrine reste lisible.
*/
export async function saveThemeAction(formData: FormData) {
  const choice = String(formData.get("theme") || "").trim();

  if (!isThemeId(choice)) {
    redirect(`${BASE}?error=${encodeURIComponent("Ce thème n'existe pas.")}`);
  }

  const saved = await saveSellerTheme(choice);

  if (!saved.ok) {
    redirect(`${BASE}?error=${encodeURIComponent(saved.reason)}`);
  }

  revalidatePath(BASE);
  revalidatePath("/store/[slug]", "page");

  redirect(
    `${BASE}?success=${encodeURIComponent(
      `Thème enregistré : ${themeById(choice).label}.`
    )}`
  );
}
