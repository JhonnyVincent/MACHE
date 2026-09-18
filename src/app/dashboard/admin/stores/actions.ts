"use server";

/*
  ACTION : vérification d'une boutique.

  Accorder le badge « vérifiée » engage MACHÉ auprès des clients : il est
  affiché sur la vitrine et sur les fiches produit, et il fait passer les
  produits de cette boutique en publication directe. La décision reste
  donc au personnel, revérifié en base.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminForWrite } from "@/lib/admin";

const BASE = "/dashboard/admin/stores";

function fail(message: string): never {
  redirect(`${BASE}?error=${encodeURIComponent(message)}`);
}

export async function setStoreVerificationAction(formData: FormData) {
  const { supabase } = await requireAdminForWrite(BASE);

  const storeId = String(formData.get("store_id") || "");
  const verified = String(formData.get("verified") || "") === "true";

  if (!storeId) fail("Boutique inconnue.");

  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, legal_doc_url")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) fail("Cette boutique n'existe plus.");

  /*
    Pas de vérification sans pièce au dossier : le badge dirait au client
    qu'un contrôle a eu lieu alors qu'il n'y avait rien à contrôler.
  */
  if (verified && !store.legal_doc_url) {
    fail("Cette boutique n'a fourni aucun document légal : rien à vérifier.");
  }

  const { error } = await supabase
    .from("stores")
    .update({ is_verified: verified })
    .eq("id", storeId);

  if (error) fail(error.message);

  revalidatePath(BASE);
  revalidatePath(`/store/${store.slug || storeId}`);

  redirect(`${BASE}?success=${verified ? "verified" : "unverified"}`);
}
