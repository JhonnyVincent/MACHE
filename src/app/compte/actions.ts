"use server";

/*
  ACTIONS : compte client.

  Le jeton de session n'est jamais renvoyé au navigateur : il est déposé
  dans un cookie httpOnly par la couche Medusa. Ces actions ne font que
  router et rapporter l'erreur.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  registerCustomer, loginCustomer, clearCustomerSession,
} from "@/lib/medusa/customer";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData) {
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
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard/buyer");

  if (!email || !password) {
    fail("/compte/connexion", "Renseignez votre adresse e-mail et votre mot de passe.");
  }

  const result = await loginCustomer(email, password);

  if (!result.ok) fail("/compte/connexion", result.reason);

  revalidatePath("/dashboard/buyer", "layout");

  /* Une redirection ne suit que des chemins internes. */
  redirect(next.startsWith("/") ? next : "/dashboard/buyer");
}

export async function logoutAction() {
  await clearCustomerSession();
  revalidatePath("/", "layout");
  redirect("/");
}
