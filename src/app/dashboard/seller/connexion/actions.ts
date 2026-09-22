"use server";

/*
  ACTION : connexion d'un vendeur.

  L'adresse de la boutique n'est plus demandée. Elle l'était parce que
  la session avait besoin d'un identifiant de boutique, qu'on allait
  chercher dans l'API publique — laquelle ne montre pas les boutiques en
  attente d'approbation. Un vendeur qui venait d'ouvrir la sienne ne
  pouvait donc pas se reconnecter.

  Le backend sait à quelles boutiques un compte appartient. On le lui
  demande. Le champ ne réapparaît que pour quelqu'un qui gère plusieurs
  boutiques, et `loginVendor` s'en sert alors pour départager.
*/

import { redirect } from "next/navigation";
import { isControlFlow, reasonOf } from "@/lib/safe-action";
import { reportOutage } from "@/lib/medusa/outage";
import { loginVendor, clearVendorSession } from "@/lib/medusa/vendor";

const BASE = "/dashboard/seller/connexion";

export async function vendorLoginAction(formData: FormData) {
  /*
    Tout le corps est enveloppé : une exception rendrait « Application
    error » à un vendeur qui essaie simplement d'entrer chez lui.
    `redirect()` fonctionne en levant, donc on le relaie intact.
  */
  try {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const handle = String(formData.get("store_handle") || "").trim().toLowerCase();

    const next = String(formData.get("next") || "/dashboard/seller").trim();

    /* On ne renvoie que vers une page de ce site. */
    const safeNext =
      next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard/seller";

    const fail = (message: string) =>
      redirect(`${BASE}?error=${encodeURIComponent(message)}`);

    if (!email || !password) {
      fail("Renseignez votre adresse e-mail et votre mot de passe.");
    }

    const result = await loginVendor(email, password, handle);

    if (!result.ok) fail(result.reason);

    redirect(safeNext);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage("connexion vendeur", reasonOf(error));

    redirect(
      `${BASE}?error=${encodeURIComponent(
        "La connexion n'a pas abouti. Réessayez dans quelques minutes."
      )}`
    );
  }
}

export async function vendorLogoutAction() {
  await clearVendorSession();
  redirect("/dashboard/seller/connexion");
}
