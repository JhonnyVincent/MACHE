"use server";

import { redirect } from "next/navigation";
import {
  isResetActor,
  LOGIN_PAGE,
  requestPasswordReset,
  setNewPassword,
  type ResetActor,
} from "@/lib/medusa/password";

function actorFrom(formData: FormData): ResetActor {
  const value = String(formData.get("acteur") || "");
  return isResetActor(value) ? value : "customer";
}

export async function requestResetAction(formData: FormData) {
  const actor = actorFrom(formData);
  const email = String(formData.get("email") || "");

  const result = await requestPasswordReset(actor, email);

  if (!result.ok) {
    redirect(`/mot-de-passe?acteur=${actor}&erreur=${encodeURIComponent(result.reason)}`);
  }

  /*
    La même page de confirmation qu'un compte existe ou non : c'est ce
    qui empêche d'apprendre ici qui est inscrit chez MACHÉ.
  */
  redirect(`/mot-de-passe?acteur=${actor}&envoye=1`);
}

export async function setPasswordAction(formData: FormData) {
  const actor = actorFrom(formData);
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  const back = (reason: string) =>
    redirect(
      `/mot-de-passe/nouveau?acteur=${actor}&token=${encodeURIComponent(token)}&erreur=${encodeURIComponent(reason)}`
    );

  if (password !== confirm) back("Les deux mots de passe ne sont pas identiques.");

  const result = await setNewPassword(actor, token, password);

  if (!result.ok) {
    /* Lien mort : inutile de le garder dans l'adresse, on renvoie vers une nouvelle demande. */
    if (result.expired) {
      redirect(`/mot-de-passe?acteur=${actor}&erreur=${encodeURIComponent(result.reason)}`);
    }
    back(result.reason);
  }

  redirect(`${LOGIN_PAGE[actor]}?reinitialise=1`);
}
