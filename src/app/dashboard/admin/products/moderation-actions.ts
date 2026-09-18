"use server";

/*
  ACTIONS : décisions de modération

  Le droit de modérer n'est jamais déduit du formulaire : lib/moderation
  relit le rôle en base à chaque appel. Un vendeur qui forgerait la requête
  n'obtiendrait rien.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { applyDecision, type Decision } from "@/lib/moderation";

const BASE = "/dashboard/admin/products";

export async function moderateProductAction(formData: FormData) {
  const productId = String(formData.get("product_id") || "");
  const decision = String(formData.get("decision") || "") as Decision;
  const reason = String(formData.get("reason") || "");
  const filter = String(formData.get("filter") || "");

  const result = await applyDecision(productId, decision, reason);

  const params = new URLSearchParams();
  if (filter) params.set("status", filter);

  if (!result.ok) {
    params.set("error", result.message);
    redirect(`${BASE}?${params.toString()}`);
  }

  params.set("done", result.status);

  /*
    Le catalogue public filtre sur status = 'active' : la décision change la
    visibilité réelle du produit. On invalide donc aussi les pages publiques.
  */
  revalidatePath(BASE);
  revalidatePath("/shop");
  revalidatePath("/");

  redirect(`${BASE}?${params.toString()}`);
}
