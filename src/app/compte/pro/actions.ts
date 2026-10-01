"use server";

/*
  ACTION : demander un compte professionnel.

  Le client doit être connecté : un statut professionnel s'attache à un
  compte. La demande part à MACHE, qui la valide dans l'administration
  (voir backend/packages/api/src/lib/pro-buyers.ts) — rien n'est accordé
  par le simple envoi.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isControlFlow, reasonOf } from "@/lib/safe-action";
import { reportOutage } from "@/lib/medusa/outage";
import { requestProAccount } from "@/lib/medusa/customer";
import { spamCheck } from "@/lib/anti-spam";

const BACK = "/compte/pro";

function fail(message: string): never {
  redirect(`${BACK}?error=${encodeURIComponent(message)}`);
}

export async function requestProAction(formData: FormData) {
  const blocked = await spamCheck("contact", formData);

  if (blocked) fail(blocked);

  try {
    const field = (name: string) => String(formData.get(name) || "").trim();

    const result = await requestProAccount({
      organisation: field("organisation"),
      type: field("type"),
      city: field("city"),
      phone: field("phone"),
      note: field("note"),
    });

    if (!result.ok) fail(result.reason);

    revalidatePath("/compte/pro");
    revalidatePath("/gros");
    redirect(`${BACK}?envoye=1`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage("demande de compte professionnel", reasonOf(error));

    fail("L'envoi n'a pas abouti. Réessayez dans quelques minutes.");
  }
}
