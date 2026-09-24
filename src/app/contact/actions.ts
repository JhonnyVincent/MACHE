"use server";

/*
  ACTION : envoyer un message à MACHÉ.

  Le jeton de lecture transite par l'URL après l'envoi, et c'est un
  choix à assumer : il apparaît dans la barre d'adresse et dans
  l'historique du navigateur.

  La raison : une action serveur ne peut rien rendre à une page qu'elle
  redirige, et ce jeton est la SEULE clé de sa conversation pour
  quelqu'un sans compte. Le garder ailleurs — en session, en cookie —
  le perdrait au premier changement d'appareil, ce qui est exactement
  le cas où l'on a besoin de le recopier.

  Il est donc affiché, avec la consigne de le conserver. Un jeton
  visible qu'on peut noter vaut mieux qu'un jeton propre qu'on ne
  retrouve jamais.
*/

import { redirect } from "next/navigation";
import { openThread } from "@/lib/medusa/support";
import { isControlFlow, reasonOf } from "@/lib/safe-action";
import { reportOutage } from "@/lib/medusa/outage";

function fail(message: string): never {
  redirect(`/contact?error=${encodeURIComponent(message)}`);
}

export async function sendMessageAction(formData: FormData) {
  const fromName = String(formData.get("from_name") || "").trim();
  const fromEmail = String(formData.get("from_email") || "").trim().toLowerCase();
  const fromPhone = String(formData.get("from_phone") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const category = String(formData.get("category") || "question");
  const message = String(formData.get("message") || "").trim();

  if (!fromName) fail("Indiquez votre nom.");
  if (!fromEmail.includes("@")) fail("Indiquez une adresse e-mail valide.");
  if (!subject) fail("Donnez un objet à votre message.");
  if (message.length < 10) fail("Écrivez votre message.");

  let threadId: string;
  let token: string;

  try {
    const result = await openThread({
      fromName,
      fromEmail,
      fromPhone: fromPhone || undefined,
      subject,
      category,
      message,
    });

    if (!result.ok) fail(result.reason);

    threadId = result.data.thread.id;
    token = result.data.accessToken;
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage("envoi d'un message", reasonOf(error));

    fail("Le message n'est pas parti. Réessayez dans quelques minutes.");
  }

  redirect(
    `/messages/${encodeURIComponent(threadId)}?token=${encodeURIComponent(
      token
    )}&envoye=1`
  );
}
