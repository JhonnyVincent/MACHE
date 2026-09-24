"use server";

/*
  ACTIONS : signer ou refuser un contrat reçu.

  Ce qui n'est PAS vérifié ici : que le texte n'a pas changé depuis
  l'envoi. Le backend le revérifie au moment même de la signature, en
  recalculant l'empreinte — et refuse si elle diffère. Le refaire ici
  donnerait deux jugements pour une seule question, et le jour où l'un
  des deux évoluerait seul, c'est le plus permissif qui déciderait.

  Ce qui EST vérifié ici : que le nom a été tapé. Autant le dire avant
  l'aller-retour.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signVendorContract, declineVendorContract } from "@/lib/medusa/vendor";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

function back(id: string, params: Record<string, string>): never {
  const search = new URLSearchParams(params);

  redirect(`/dashboard/seller/contrats/${encodeURIComponent(id)}?${search.toString()}`);
}

export async function signContractAction(formData: FormData) {
  const id = String(formData.get("contract_id") || "");
  const signerName = String(formData.get("signer_name") || "").trim();
  const signerRole = String(formData.get("signer_role") || "").trim();
  const signerEmail = String(formData.get("signer_email") || "").trim();
  const agreed = formData.get("agreed") === "on";

  if (!id) redirect("/dashboard/seller/contrats");

  if (signerName.length < 3) {
    back(id, { error: "Tapez votre nom complet pour signer." });
  }

  /*
    La case est vérifiée séparément du nom, et le backend l'exige aussi.
    Deux gestes valent mieux qu'un : on ne coche pas une case et on ne
    tape pas son nom par le même réflexe.
  */
  if (!agreed) {
    back(id, { error: "Cochez la case pour confirmer que vous acceptez ce contrat." });
  }

  try {
    const result = await signVendorContract(id, {
      signerName,
      signerRole: signerRole || undefined,
      signerEmail: signerEmail || undefined,
    });

    if (!result.ok) back(id, { error: result.reason });

    revalidatePath("/dashboard/seller/contrats");
    revalidatePath(`/dashboard/seller/contrats/${id}`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    back(id, { error: reasonOf(error) });
  }

  back(id, { success: "Contrat signé." });
}

export async function declineContractAction(formData: FormData) {
  const id = String(formData.get("contract_id") || "");
  const reason = String(formData.get("reason") || "").trim();

  if (!id) redirect("/dashboard/seller/contrats");

  /*
    Une raison est demandée. Un refus sans motif oblige MACHÉ à
    rappeler pour comprendre, et le marchand à réexpliquer — alors
    qu'il vient de le décider.
  */
  if (reason.length < 5) {
    back(id, { error: "Dites en une phrase pourquoi vous refusez." });
  }

  try {
    const result = await declineVendorContract(id, reason);

    if (!result.ok) back(id, { error: result.reason });

    revalidatePath("/dashboard/seller/contrats");
    revalidatePath(`/dashboard/seller/contrats/${id}`);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    back(id, { error: reasonOf(error) });
  }

  back(id, { success: "Refus enregistré. MACHÉ en est informé." });
}
