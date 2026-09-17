"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePublicationStatus } from "@/lib/moderation";

export async function createStoreProductAction(storeId: string, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim();

  const price = Number(formData.get("price") || 0);
  const stock = Number(formData.get("stock") || 0);

  if (!title || !category || price <= 0) {
    redirect(`/dashboard/seller/stores/${storeId}/products/new?error=missing_fields`);
  }

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=/dashboard/seller/stores/${storeId}/products/new`);
  }

  const uid = userData.user.id;

  const { data: store } = await supabase
    .from("stores")
    .select("id, owner_id")
    .eq("id", storeId)
    .eq("owner_id", uid)
    .single();

  if (!store) {
    redirect("/dashboard/seller/stores?error=store_introuvable");
  }

  /*
    Le statut de publication est décidé côté serveur, jamais par le
    formulaire : un vendeur ne doit pas pouvoir contourner une validation
    quand MACHÉ l'impose (réglage require_product_review).
  */
  const { data: storeRow } = await supabase
    .from("stores")
    .select("is_verified, legal_doc_url")
    .eq("id", store.id)
    .maybeSingle();

  const status = await resolvePublicationStatus({
    vendorVerified: Boolean(storeRow?.is_verified),
    documentsValid: Boolean(storeRow?.legal_doc_url),
    categoryAllowed: Boolean(category),
    requiredFieldsComplete: Boolean(title && price > 0),
    anomalyDetected: false,
  });

  const { error } = await supabase.from("products").insert({
    seller_id: uid,
    store_id: store.id,
    title,
    description,
    category,
    price,
    stock,
    image_url: imageUrl || null,
    status,
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    redirect(
      `/dashboard/seller/stores/${storeId}/products/new?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/dashboard/seller/stores/${storeId}`);
}
