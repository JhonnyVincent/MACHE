"use server";

/*
  ACTIONS : les textes publics du site.

  La seule chose que ces actions font en plus de transmettre : vider le
  cache. Le storefront garde ces pages dix minutes ; sans invalidation,
  l'administrateur publierait, rechargerait la page publique, ne verrait
  rien changer, et recommencerait — en concluant que ça ne marche pas.
*/

import { redirect } from "next/navigation";
import { revalidateTag, revalidatePath } from "next/cache";
import {
  createPolicy,
  editPolicy,
  publishPolicy,
  newPolicyVersion,
  archivePolicy,
} from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const LIST = "/dashboard/admin/textes";

function toList(params: Record<string, string>): never {
  redirect(`${LIST}?${new URLSearchParams(params).toString()}`);
}

function toVersion(id: string, params: Record<string, string>): never {
  redirect(`${LIST}/${encodeURIComponent(id)}?${new URLSearchParams(params).toString()}`);
}

/*
  Après une publication, trois choses à rafraîchir : l'étiquette de
  cache que lit le storefront, la page publique elle-même, et l'écran
  d'administration. En oublier une donne un écran qui se contredit.
*/
function refresh(slug: string, path: string) {
  revalidateTag("policies");
  revalidateTag(`policy-${slug}`);
  revalidatePath(path);
  revalidatePath(LIST);
}

export async function createPolicyAction(formData: FormData) {
  const slug = String(formData.get("slug") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const changeNote = String(formData.get("change_note") || "").trim();

  if (!slug) toList({ error: "Choisissez la page à modifier." });
  if (!title) toList({ error: "Donnez un titre à la page." });

  if (body.length < 20) {
    toList({ error: "Le texte est trop court pour remplacer une page légale." });
  }

  let created: string;

  try {
    const result = await createPolicy({
      slug,
      title,
      summary: summary || undefined,
      body,
      changeNote: changeNote || undefined,
    });

    if (!result.ok) toList({ error: result.reason });

    created = result.data.id;

    revalidatePath(LIST);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toList({ error: reasonOf(error) });
  }

  toVersion(created, {
    success: "Brouillon créé. Rien n'est en ligne tant que vous ne l'avez pas publié.",
  });
}

export async function editPolicyAction(formData: FormData) {
  const id = String(formData.get("policy_id") || "");
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const changeNote = String(formData.get("change_note") || "").trim();

  if (!id) redirect(LIST);

  if (!title || body.length < 20) {
    toVersion(id, { error: "Un titre et un texte sont nécessaires." });
  }

  try {
    const result = await editPolicy(id, { title, summary, body, changeNote });

    if (!result.ok) toVersion(id, { error: result.reason });

    revalidatePath(`${LIST}/${id}`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toVersion(id, { error: reasonOf(error) });
  }

  toVersion(id, { success: "Brouillon enregistré." });
}

export async function publishPolicyAction(formData: FormData) {
  const id = String(formData.get("policy_id") || "");
  const slug = String(formData.get("slug") || "");
  const path = String(formData.get("path") || "/");

  if (!id) redirect(LIST);

  try {
    const result = await publishPolicy(id);

    if (!result.ok) toVersion(id, { error: result.reason });

    refresh(slug, path);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toVersion(id, { error: reasonOf(error) });
  }

  toVersion(id, {
    success:
      "Texte en vigueur. Il s'affiche maintenant sur le site, et la version précédente est passée en archive — elle reste lisible.",
  });
}

export async function newPolicyVersionAction(formData: FormData) {
  const id = String(formData.get("policy_id") || "");
  const body = String(formData.get("body") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const changeNote = String(formData.get("change_note") || "").trim();

  if (!id) redirect(LIST);

  if (body.length < 20) {
    toVersion(id, { error: "Le texte de la nouvelle version est trop court." });
  }

  let created: string;

  try {
    const result = await newPolicyVersion(id, {
      body,
      title: title || undefined,
      changeNote: changeNote || undefined,
    });

    if (!result.ok) toVersion(id, { error: result.reason });

    created = result.data.id;

    revalidatePath(LIST);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toVersion(id, { error: reasonOf(error) });
  }

  toVersion(created, {
    success:
      "Nouvelle version en brouillon. L'ancienne reste en vigueur sur le site tant que vous n'avez pas publié celle-ci.",
  });
}

export async function archivePolicyAction(formData: FormData) {
  const id = String(formData.get("policy_id") || "");
  const slug = String(formData.get("slug") || "");
  const path = String(formData.get("path") || "/");
  const wasLive = formData.get("was_live") === "1";

  if (!id) redirect(LIST);

  try {
    const result = await archivePolicy(id);

    if (!result.ok) toVersion(id, { error: result.reason });

    refresh(slug, path);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toVersion(id, { error: reasonOf(error) });
  }

  /*
    Retirer la version en vigueur n'est pas anodin : la page retombe sur
    le texte écrit dans le code. Ce n'est pas une panne, mais ce n'est
    probablement pas ce qu'on voulait, et le taire serait pire.
  */
  toVersion(id, {
    success: wasLive
      ? "Version retirée. Cette page affiche à nouveau son texte d'origine, celui écrit dans le code du site."
      : "Version archivée.",
  });
}
