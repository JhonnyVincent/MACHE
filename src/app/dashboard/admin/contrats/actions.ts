"use server";

/*
  ACTIONS : le cycle de vie d'un contrat, côté administration.

  Aucune de ces actions ne décide si le geste est permis. Le backend le
  fait, à partir de l'état réel du contrat : un brouillon se modifie, un
  contrat publié ne se modifie plus, un contrat non publié ne s'envoie
  pas. Rejouer ces règles ici donnerait deux jugements pour une question,
  et le jour où l'un des deux évoluerait seul, c'est le plus permissif
  qui déciderait.

  Ce qui est vérifié ici : que le formulaire n'est pas vide. Autant le
  dire avant l'aller-retour.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createContract,
  editContract,
  publishContract,
  newContractVersion,
  archiveContract,
  sendContract,
  revokeSignature,
} from "@/lib/medusa/admin";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

const LIST = "/dashboard/admin/contrats";

function toList(params: Record<string, string>): never {
  redirect(`${LIST}?${new URLSearchParams(params).toString()}`);
}

function toContract(id: string, params: Record<string, string>): never {
  redirect(
    `${LIST}/${encodeURIComponent(id)}?${new URLSearchParams(params).toString()}`
  );
}

export async function createContractAction(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!title) toList({ error: "Donnez un titre au contrat." });

  if (body.length < 20) {
    toList({ error: "Le texte du contrat est trop court pour être envoyé à qui que ce soit." });
  }

  let created: string;

  try {
    const result = await createContract({ title, summary: summary || undefined, body });

    if (!result.ok) toList({ error: result.reason });

    created = result.data.id;

    revalidatePath(LIST);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toList({ error: reasonOf(error) });
  }

  toContract(created, { success: "Brouillon créé. Relisez-le avant de le publier." });
}

export async function editContractAction(formData: FormData) {
  const id = String(formData.get("contract_id") || "");
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!id) redirect(LIST);

  if (!title || body.length < 20) {
    toContract(id, { error: "Un titre et un texte sont nécessaires." });
  }

  try {
    const result = await editContract(id, { title, summary, body });

    if (!result.ok) toContract(id, { error: result.reason });

    revalidatePath(`${LIST}/${id}`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toContract(id, { error: reasonOf(error) });
  }

  toContract(id, { success: "Brouillon enregistré." });
}

/*
  Publier fige le texte pour toujours. L'écran le dit avant ; cette
  action ne demande pas de confirmation supplémentaire, parce qu'un
  second « êtes-vous sûr ? » s'apprend par cœur et se clique sans lire.
*/
export async function publishContractAction(formData: FormData) {
  const id = String(formData.get("contract_id") || "");

  if (!id) redirect(LIST);

  try {
    const result = await publishContract(id);

    if (!result.ok) toContract(id, { error: result.reason });

    revalidatePath(LIST);
    revalidatePath(`${LIST}/${id}`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toContract(id, { error: reasonOf(error) });
  }

  toContract(id, {
    success: "Contrat publié. Son texte est désormais figé et peut être envoyé.",
  });
}

export async function newVersionAction(formData: FormData) {
  const id = String(formData.get("contract_id") || "");
  const body = String(formData.get("body") || "").trim();
  const title = String(formData.get("title") || "").trim();

  if (!id) redirect(LIST);

  if (body.length < 20) {
    toContract(id, { error: "Le texte de la nouvelle version est trop court." });
  }

  let created: string;

  try {
    const result = await newContractVersion(id, {
      body,
      title: title || undefined,
    });

    if (!result.ok) toContract(id, { error: result.reason });

    created = result.data.id;

    revalidatePath(LIST);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toContract(id, { error: reasonOf(error) });
  }

  toContract(created, {
    success:
      "Nouvelle version créée en brouillon. Les signatures déjà recueillies restent attachées à la version précédente.",
  });
}

export async function archiveContractAction(formData: FormData) {
  const id = String(formData.get("contract_id") || "");

  if (!id) redirect(LIST);

  try {
    const result = await archiveContract(id);

    if (!result.ok) toContract(id, { error: result.reason });

    revalidatePath(LIST);
    revalidatePath(`${LIST}/${id}`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toContract(id, { error: reasonOf(error) });
  }

  toContract(id, { success: "Contrat archivé. Rien n'a été supprimé." });
}

export async function sendContractAction(formData: FormData) {
  const id = String(formData.get("contract_id") || "");
  const dueAt = String(formData.get("due_at") || "").trim();

  const sellerIds = formData.getAll("seller_ids").map(String).filter(Boolean);

  if (!id) redirect(LIST);

  if (sellerIds.length === 0) {
    toContract(id, { error: "Choisissez au moins une boutique." });
  }

  let summary: { sent: number; skipped: number };

  try {
    const result = await sendContract(id, sellerIds, dueAt || undefined);

    if (!result.ok) toContract(id, { error: result.reason });

    summary = result.data;

    revalidatePath(`${LIST}/${id}`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toContract(id, { error: reasonOf(error) });
  }

  /*
    Le nombre d'envois ignorés est annoncé, pas tu. Choisir vingt
    boutiques et n'en voir partir que trois sans explication ferait
    croire à une panne.
  */
  toContract(id, {
    success:
      summary.skipped > 0
        ? `${summary.sent} envoi(s). ${summary.skipped} boutique(s) avaient déjà reçu ce contrat.`
        : `${summary.sent} envoi(s).`,
  });
}

export async function revokeSignatureAction(formData: FormData) {
  const id = String(formData.get("contract_id") || "");
  const signatureId = String(formData.get("signature_id") || "");

  if (!id || !signatureId) redirect(LIST);

  try {
    const result = await revokeSignature(id, signatureId);

    if (!result.ok) toContract(id, { error: result.reason });

    revalidatePath(`${LIST}/${id}`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    toContract(id, { error: reasonOf(error) });
  }

  toContract(id, { success: "Envoi retiré." });
}
