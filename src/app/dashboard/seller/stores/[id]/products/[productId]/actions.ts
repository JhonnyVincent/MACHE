"use server";

/*
  ACTIONS : modification et suppression d'un produit.

  Mêmes colonnes et même décision de statut qu'à la création : voir
  src/lib/products.ts. Un vendeur exprime une intention — en ligne, en
  pause, brouillon — et le serveur en déduit le statut réel. Le formulaire
  ne peut pas imposer `active` et contourner un examen.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  requireOwnedStoreForWrite, readProductForm, validateProductForm,
  resolveStatusFor, productColumns,
} from "@/lib/products";

export async function updateProductAction(formData: FormData) {
  const storeId = String(formData.get("store_id") || "");
  const productId = String(formData.get("product_id") || "");

  const backTo = `/dashboard/seller/stores/${storeId}/products/${productId}`;

  if (!storeId || !productId) {
    redirect(`/dashboard/seller/stores/${storeId}/products?error=produit_inconnu`);
  }

  const { supabase, store, uid } = await requireOwnedStoreForWrite(storeId, backTo);

  const values = readProductForm(formData);
  const problem = validateProductForm(values);

  if (problem) {
    redirect(`${backTo}?error=${encodeURIComponent(problem)}`);
  }

  const status = await resolveStatusFor(values, store);

  /*
    Les trois filtres sont cumulés à dessein : un identifiant de produit
    venu du formulaire ne prouve rien, et un produit ne se modifie que
    dans la boutique et par le vendeur auxquels il appartient.
  */
  const { data: updated, error } = await supabase
    .from("products")
    .update(productColumns(values, status))
    .eq("id", productId)
    .eq("store_id", storeId)
    .eq("seller_id", uid)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(`${backTo}?error=${encodeURIComponent(error.message)}`);
  }

  if (!updated) {
    redirect(`${backTo}?error=${encodeURIComponent("Ce produit ne vous appartient pas.")}`);
  }

  revalidatePath(`/dashboard/seller/stores/${storeId}`, "layout");
  redirect(`${backTo}?success=updated`);
}

export async function deleteProductAction(formData: FormData) {
  const storeId = String(formData.get("store_id") || "");
  const productId = String(formData.get("product_id") || "");

  const backTo = `/dashboard/seller/stores/${storeId}/products/${productId}`;

  if (!storeId || !productId) {
    redirect(`/dashboard/seller/stores/${storeId}/products?error=produit_inconnu`);
  }

  const { supabase, uid } = await requireOwnedStoreForWrite(storeId, backTo);

  /*
    Un produit déjà commandé n'est pas supprimé : les lignes de commande
    en gardent une copie du titre et du prix, mais l'acheteur suit encore
    son colis et peut déposer un avis. Il est archivé, ce qui le retire du
    site public sans effacer l'historique.
  */
  const { count: orderedLines } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if ((orderedLines ?? 0) > 0) {
    const { error: archiveError } = await supabase
      .from("products")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", productId)
      .eq("store_id", storeId)
      .eq("seller_id", uid);

    if (archiveError) {
      redirect(`${backTo}?error=${encodeURIComponent(archiveError.message)}`);
    }

    revalidatePath(`/dashboard/seller/stores/${storeId}`, "layout");
    redirect(`/dashboard/seller/stores/${storeId}/products?success=archived`);
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("store_id", storeId)
    .eq("seller_id", uid);

  if (error) {
    redirect(`${backTo}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/dashboard/seller/stores/${storeId}`, "layout");
  redirect(`/dashboard/seller/stores/${storeId}/products?success=deleted`);
}
