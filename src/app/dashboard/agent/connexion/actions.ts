"use server";

/*
  ACTION : connexion à l'espace agent.

  C'est la connexion CLIENT, et c'est volontaire : un agent MACHÉ est un
  client à qui s'ajoute une fonction. Il n'a pas de second compte, pas
  de second mot de passe, et surtout pas un accès à l'administration.

  Pourquoi une action à part plutôt que celle de /compte

  Uniquement pour le retour d'erreur. L'action client renvoie ses échecs
  sur /compte/connexion : un agent qui se trompe de mot de passe
  atterrirait sur une page qui ne parle plus d'agents, et croirait
  s'être trompé de porte. Le mot de passe, lui, est vérifié au même
  endroit par la même fonction — il n'y a pas deux vérifications.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loginCustomer } from "@/lib/medusa/customer";
import { isControlFlow, reasonOf } from "@/lib/safe-action";
import { reportOutage } from "@/lib/medusa/outage";

const PAGE = "/dashboard/agent/connexion";

function fail(message: string): never {
  redirect(`${PAGE}?error=${encodeURIComponent(message)}`);
}

export async function agentLoginAction(formData: FormData) {
  try {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      fail("Renseignez votre adresse e-mail et votre mot de passe.");
    }

    const result = await loginCustomer(email, password);

    if (!result.ok) fail(result.reason);

    revalidatePath("/dashboard/agent", "layout");

    /*
      On redirige vers l'espace agent sans vérifier ici que ce compte
      en est un. La page le dira, avec la phrase qui convient — « ce
      compte n'a pas de fonction agent » plutôt qu'un refus de
      connexion. Refuser la connexion serait trompeur : le compte est
      valide, c'est la fonction qui manque.
    */
    redirect("/dashboard/agent");
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage("connexion agent", reasonOf(error));

    fail("La connexion n'a pas abouti. Réessayez dans quelques minutes.");
  }
}
