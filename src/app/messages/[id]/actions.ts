"use server";

/*
  ACTION : répondre dans sa propre conversation.

  Le jeton repart tel qu'il est arrivé. Il n'est pas vérifié ici : le
  backend le compare à durée constante, et refuse avec un 404 — le même
  que pour un identifiant inconnu, afin que personne ne puisse
  distinguer « cette conversation n'existe pas » de « ce n'est pas la
  vôtre ».
*/

import { redirect } from "next/navigation";
import { replyToThread } from "@/lib/medusa/support";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

export async function replyAction(formData: FormData) {
  const id = String(formData.get("thread_id") || "");
  const token = String(formData.get("token") || "");
  const message = String(formData.get("message") || "").trim();

  if (!id) redirect("/contact");

  const query = (params: Record<string, string>) =>
    `/messages/${encodeURIComponent(id)}?${new URLSearchParams({
      ...(token ? { token } : {}),
      ...params,
    }).toString()}`;

  if (message.length < 2) {
    redirect(query({ error: "Écrivez votre message." }));
  }

  try {
    const result = await replyToThread(id, message, token || undefined);

    if (!result.ok) redirect(query({ error: result.reason }));
  } catch (error) {
    if (isControlFlow(error)) throw error;

    redirect(query({ error: reasonOf(error) }));
  }

  redirect(query({ envoye: "1" }));
}
