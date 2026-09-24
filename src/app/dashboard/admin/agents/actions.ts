"use server";

/*
  ACTIONS : les agents MACHÉ.

  Un agent est un client à qui l'administration ajoute une fonction.
  Toutes ces actions revérifient la session : une action serveur est une
  adresse comme une autre, et s'en remettre au contrôle fait par la page
  laisserait nommer un agent à qui sait former la requête — c'est-à-dire
  exactement ce que la vérification publique est censée empêcher.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/medusa/admin";
import {
  makeAgent,
  setAgentSuspended,
  revokeAgent,
  AGENT_FUNCTIONS,
} from "@/lib/medusa/agents-admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";
import { reportOutage } from "@/lib/medusa/outage";

const BASE = "/dashboard/admin/agents";

function fail(message: string): never {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`);
}

async function requireSession() {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");
}

export async function makeAgentAction(formData: FormData) {
  try {
    await requireSession();

    const email = String(formData.get("email") || "").trim().toLowerCase();
    const functionSlug = String(formData.get("function") || "").trim();

    if (!email.includes("@")) fail("Indiquez une adresse e-mail valide.");

    if (!AGENT_FUNCTIONS.some((entry) => entry.slug === functionSlug)) {
      fail("Choisissez une fonction.");
    }

    const result = await makeAgent({
      email,
      functionSlug,
      zone: String(formData.get("zone") || "").trim() || null,
      phonePublic: String(formData.get("phone") || "").trim() || null,
    });

    if (!result.ok) fail(result.reason);

    revalidatePath(BASE);

    /*
      Le code est renvoyé dans l'adresse pour être affiché UNE fois,
      bien en évidence : c'est lui qu'il faut recopier sur la carte de
      l'agent. Il n'est pas secret — un client le saisit pour vérifier —
      mais il est à transmettre, et une valeur à transmettre qu'on ne
      montre pas se perd.
    */
    redirect(
      `${BASE}?cree=${encodeURIComponent(result.data.code)}&nom=${encodeURIComponent(result.data.name)}`
    );
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage("nomination agent", reasonOf(error));

    fail("La nomination n'a pas abouti. Réessayez dans quelques minutes.");
  }
}

export async function suspendAgentAction(formData: FormData) {
  try {
    await requireSession();

    const customerId = String(formData.get("customer_id") || "").trim();
    const suspended = String(formData.get("suspended") || "") === "1";

    if (!customerId) fail("Agent introuvable.");

    const result = await setAgentSuspended(customerId, suspended);

    if (!result.ok) fail(result.reason);

    revalidatePath(BASE);

    redirect(`${BASE}?suspendu=${suspended ? "1" : "0"}`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage("suspension agent", reasonOf(error));

    fail("La décision n'a pas pu être enregistrée.");
  }
}

export async function revokeAgentAction(formData: FormData) {
  try {
    await requireSession();

    const customerId = String(formData.get("customer_id") || "").trim();
    const functionSlug = String(formData.get("function") || "").trim();

    if (!customerId || !functionSlug) fail("Agent introuvable.");

    const result = await revokeAgent(customerId, functionSlug);

    if (!result.ok) fail(result.reason);

    revalidatePath(BASE);

    redirect(`${BASE}?retire=1`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage("retrait agent", reasonOf(error));

    fail("Le retrait n'a pas pu être enregistré.");
  }
}
