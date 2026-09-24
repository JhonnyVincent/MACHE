"use server";

/*
  ACTIONS : la boîte de réception de MACHÉ.

  Répondre et noter passent par la même route mais ne sont pas le même
  geste, et l'interface ne doit jamais les confondre : une réponse part
  chez la personne, une note reste ici. Ce sont deux formulaires
  distincts, avec deux boutons distincts — pas une case « interne » à
  cocher, qu'on oublie de cocher précisément le jour où la note ne
  devait pas sortir.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  replyToCustomer,
  addInternalNote,
  closeThread,
  reopenThread,
} from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const LIST = "/dashboard/admin/messages";

function back(id: string, params: Record<string, string>): never {
  redirect(`${LIST}/${encodeURIComponent(id)}?${new URLSearchParams(params).toString()}`);
}

function refresh(id: string) {
  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
}

export async function replyAction(formData: FormData) {
  const id = String(formData.get("thread_id") || "");
  const message = String(formData.get("message") || "").trim();

  if (!id) redirect(LIST);

  if (message.length < 2) back(id, { error: "Écrivez votre réponse." });

  try {
    const result = await replyToCustomer(id, message);

    if (!result.ok) back(id, { error: result.reason });

    refresh(id);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    back(id, { error: reasonOf(error) });
  }

  /*
    On rappelle ce que la réponse ne fait PAS : prévenir. Sans e-mail,
    la personne ne saura qu'on a répondu qu'en revenant. L'écrire ici
    évite de croire le dossier clos.
  */
  back(id, {
    success:
      "Réponse enregistrée. Elle s'affichera dans la conversation — la personne n'est pas prévenue, elle la verra en revenant.",
  });
}

export async function noteAction(formData: FormData) {
  const id = String(formData.get("thread_id") || "");
  const message = String(formData.get("message") || "").trim();
  const authorName = String(formData.get("author_name") || "MACHÉ").trim();

  if (!id) redirect(LIST);

  if (message.length < 2) back(id, { error: "Écrivez votre note." });

  try {
    const result = await addInternalNote(id, message, authorName || "MACHÉ");

    if (!result.ok) back(id, { error: result.reason });

    refresh(id);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    back(id, { error: reasonOf(error) });
  }

  back(id, { success: "Note interne ajoutée. Elle n'est pas visible par la personne." });
}

export async function closeThreadAction(formData: FormData) {
  const id = String(formData.get("thread_id") || "");

  if (!id) redirect(LIST);

  try {
    const result = await closeThread(id);

    if (!result.ok) back(id, { error: result.reason });

    refresh(id);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    back(id, { error: reasonOf(error) });
  }

  back(id, { success: "Conversation close." });
}

export async function reopenThreadAction(formData: FormData) {
  const id = String(formData.get("thread_id") || "");

  if (!id) redirect(LIST);

  try {
    const result = await reopenThread(id);

    if (!result.ok) back(id, { error: result.reason });

    refresh(id);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    back(id, { error: reasonOf(error) });
  }

  back(id, { success: "Conversation rouverte." });
}
