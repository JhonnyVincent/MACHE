"use server";

/*
  ACTIONS : CMS produit vendeur

  Sert à :
  - Modifier un produit existant
  - Supprimer un produit
  - Vérifier que le vendeur connecté possède bien le store
  - Sauvegarder titre, slug, prix, stock, catégorie, description, statut, images
*/

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function parseImageUrls(value: string) {
  return value
    .split(/\n|,/)
    .map((url) => url.trim())
    .filter(Boolean);
}

async function verifyStoreOwner(storeId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=/dashboard/seller/stores/${storeId}`);
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, owner_id")
    .eq("id", storeId)
    .eq("owner_id", userData.user.id)
    .single();

  if (!store) {
    redirect("/dashboard/seller/stores?error=store_introuvable");
  }

  return {
    supabase,
    userId: userData.user.id,
    store,
  };
}

export async function updateProductAction(formData: FormData) {
  const storeId = String(formData.get("store_id") || "");
  const productId = String(formData.get("product_id") || "");

  const title = String(formData.get("title") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const status = String(formData.get("status") || "draft").trim();

  const price = Number(formData.get("price") || 0);
  const stock = Number(formData.get("stock") || 0);
  const imageUrlsText = String(formData.get("image_urls") || "");
  const image_urls = parseImageUrls(imageUrlsText);

  if (!storeId || !productId || !title) {
    redirect(`/dashboard/seller/stores/${storeId}/products/${productId}?error=missing_fields`);
  }

  const { supabase, userId } = await verifyStoreOwner(storeId);

  const slug = slugInput || createSlug(title);

  const { error } = await supabase
    .from("products")
    .update({
      title,
      slug,
      description,
      category,
      price,
      stock,
      status,
      image_urls,
      seller_id: userId,
      store_id: storeId,
    })
    .eq("id", productId)
    .eq("store_id", storeId)
    .eq("seller_id", userId);

  if (error) {
    redirect(
      `/dashboard/seller/stores/${storeId}/products/${productId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/dashboard/seller/stores/${storeId}/products/${productId}?success=updated`);
}

export async function deleteProductAction(formData: FormData) {
  const storeId = String(formData.get("store_id") || "");
  const productId = String(formData.get("product_id") || "");

  if (!storeId || !productId) {
    redirect(`/dashboard/seller/stores/${storeId}/products?error=missing_product`);
  }

  const { supabase, userId } = await verifyStoreOwner(storeId);

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("store_id", storeId)
    .eq("seller_id", userId);

  if (error) {
    redirect(`/dashboard/seller/stores/${storeId}/products?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/dashboard/seller/stores/${storeId}/products?success=deleted`);
}
