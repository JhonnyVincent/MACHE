"use server";

/*
  ACTIONS : activer ou retirer le second facteur.

  Les codes de secours passent par l'URL après activation, et c'est un
  choix qu'il faut assumer : ils apparaissent alors dans la barre
  d'adresse et dans l'historique du navigateur.

  La raison : ils ne sont lisibles qu'UNE fois, et une action serveur
  ne peut rien rendre à une page qu'elle redirige. Les faire revenir
  autrement demanderait de les garder quelque part — en session, en
  base, en clair — c'est-à-dire précisément ce que leur hachage
  cherche à éviter.

  Ils sont donc de passage, et l'écran dit de les noter tout de suite.
  Un onglet d'administration ouvert sur son propre poste est un risque
  d'une autre nature qu'une liste de clés rangée en clair dans une base.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  startTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
} from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const PAGE = "/dashboard/admin/securite";

function back(params: Record<string, string>): never {
  const search = new URLSearchParams(params);

  redirect(`${PAGE}?${search.toString()}`);
}

export async function startTwoFactorAction() {
  try {
    const result = await startTwoFactor();

    if (!result.ok) back({ error: result.reason });

    /*
      Le secret transite par l'URL le temps de l'inscription. Il ne vaut
      rien sans le code qui le confirme, et il est remplacé au prochain
      « recommencer ».
    */
    back({ secret: result.data.secret, uri: result.data.uri });
  } catch (error) {
    if (isControlFlow(error)) throw error;

    back({ error: reasonOf(error) });
  }
}

export async function confirmTwoFactorAction(formData: FormData) {
  const code = String(formData.get("code") || "").trim();
  const secret = String(formData.get("secret") || "");
  const uri = String(formData.get("uri") || "");

  if (!code) {
    back({ secret, uri, error: "Saisissez le code affiché par votre application." });
  }

  try {
    const result = await confirmTwoFactor(code);

    if (!result.ok) back({ secret, uri, error: result.reason });

    revalidatePath(PAGE);

    back({ codes: result.data.join(","), success: "Protection activée." });
  } catch (error) {
    if (isControlFlow(error)) throw error;

    back({ secret, uri, error: reasonOf(error) });
  }
}

export async function disableTwoFactorAction(formData: FormData) {
  const code = String(formData.get("code") || "").trim();
  const recovery = String(formData.get("recovery") || "").trim();

  if (!code && !recovery) {
    back({ error: "Saisissez un code valide pour retirer la protection." });
  }

  try {
    const result = await disableTwoFactor(recovery ? { recovery } : { code });

    if (!result.ok) back({ error: result.reason });

    revalidatePath(PAGE);

    back({ success: "Protection retirée. Ce compte n'est plus protégé que par son mot de passe." });
  } catch (error) {
    if (isControlFlow(error)) throw error;

    back({ error: reasonOf(error) });
  }
}
