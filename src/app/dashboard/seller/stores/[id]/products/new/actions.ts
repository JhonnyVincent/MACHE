"use server";

/*
  ACTION : création d'un produit dans une boutique.

  Toute la logique — colonnes écrites, validation, décision de statut —
  vit dans src/lib/products.ts, partagée avec la modification. Cette
  action ne fait que l'enchaîner et router.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  requireOwnedStoreForWrite, readProductForm, validateProductForm,
  resolveStatusFor, productColumns,
} from "@/lib/products";

export async function createStoreProductAction(storeId: string, formData: FormData) {
  const backTo = `/dashboard/seller/stores/${storeId}/products/new`;

  const { supabase, store, uid } = await requireOwnedStoreForWrite(storeId, backTo);

  const values = readProductForm(formData);
  const problem = validateProductForm(values);

  if (problem) {
    redirect(`${backTo}?error=${encodeURIComponent(problem)}`);
  }

  const status = await resolveStatusFor(values, store);

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      ...productColumns(values, status),
      seller_id: uid,
      store_id: store.id,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !created) {
    redirect(`${backTo}?error=${encodeURIComponent(error?.message || "Création impossible.")}`);
  }

  revalidatePath(`/dashboard/seller/stores/${storeId}`, "layout");

  redirect(
    `/dashboard/seller/stores/${storeId}/products/${created.id}?success=created`
  );
}
