"use server";

/*
  ACTIONS : compte client.

  Le jeton de session n'est jamais renvoyé au navigateur : il est déposé
  dans un cookie httpOnly par la couche Medusa. Ces actions ne font que
  router et rapporter l'erreur.
*/

import { redirect } from "next/navigation";
import { isControlFlow, reasonOf } from "@/lib/safe-action";
import { reportOutage } from "@/lib/medusa/outage";
import { revalidatePath } from "next/cache";
import {
  registerCustomer, loginCustomer, clearCustomerSession,
} from "@/lib/medusa/customer";
import { safeInternalPath } from "@/lib/safe-url";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData) {
  /*
    Tout le corps est enveloppé.

    Une exception ici rendrait « Application error » : la personne ne
    saurait pas si son compte a été créé, ne pourrait rien corriger, et
    n'aurait aucune raison de réessayer. On rend donc le formulaire avec
    une phrase, et la raison technique part au journal du serveur.

    `redirect()` fonctionne en levant : on le relaie intact, sinon la
    redirection de fin ne se produirait jamais.
  */
  try {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const firstName = String(formData.get("first_name") || "").trim();
    const lastName = String(formData.get("last_name") || "").trim();

    if (!email.includes("@")) fail("/compte/inscription", "Adresse e-mail invalide.");
    if (!firstName || !lastName) fail("/compte/inscription", "Indiquez votre prénom et votre nom.");

    /*
      Huit caractères au minimum. Pas de règle de complexité exotique : elles
      poussent surtout à noter le mot de passe sur un papier.
    */
    if (password.length < 8) {
      fail("/compte/inscription", "Le mot de passe doit faire au moins 8 caractères.");
    }

    const result = await registerCustomer(email, password, firstName, lastName);

    if (!result.ok) fail("/compte/inscription", result.reason);

    revalidatePath("/dashboard/buyer", "layout");
    redirect("/dashboard/buyer");
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage('inscription client', reasonOf(error));

    fail(
      '/compte/inscription',
      "La création du compte n'a pas abouti. Réessayez dans quelques minutes."
    );
  }
}

export async function loginAction(formData: FormData) {
  /*
    Tout le corps est enveloppé.

    Une exception ici rendrait « Application error » : la personne ne
    saurait pas si son compte a été créé, ne pourrait rien corriger, et
    n'aurait aucune raison de réessayer. On rend donc le formulaire avec
    une phrase, et la raison technique part au journal du serveur.

    `redirect()` fonctionne en levant : on le relaie intact, sinon la
    redirection de fin ne se produirait jamais.
  */
  try {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const next = String(formData.get("next") || "/dashboard/buyer");

    if (!email || !password) {
      fail("/compte/connexion", "Renseignez votre adresse e-mail et votre mot de passe.");
    }

    const result = await loginCustomer(email, password);

    if (!result.ok) fail("/compte/connexion", result.reason);

    revalidatePath("/dashboard/buyer", "layout");

    /*
      `startsWith("/")` ne suffisait pas : « //evil.example » y passe et le
      navigateur le résout en adresse externe. Renvoyer quelqu'un sur un
      site tiers juste après sa saisie de mot de passe est le décor idéal
      d'un hameçonnage.
    */
    redirect(safeInternalPath(next, "/dashboard/buyer"));
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage('connexion client', reasonOf(error));

    fail(
      '/compte/connexion',
      "La connexion n'a pas abouti. Réessayez dans quelques minutes."
    );
  }
}

export async function logoutAction() {
  await clearCustomerSession();
  revalidatePath("/", "layout");
  redirect("/");
}
