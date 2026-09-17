"use server";

/*
  ACTION : réponse d'une boutique à un avis

  La propriété de la boutique est vérifiée avant toute écriture : la
  politique RLS le fait déjà, mais un contrôle applicatif évite de dépendre
  d'un seul rempart.

  Seules les colonnes de réponse sont écrites. La note et le texte du client
  ne doivent jamais pouvoir être modifiés par la boutique commentée.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/seller";
import { replyToReview } from "@/lib/reviews";

export async function replyToReviewAction(formData: FormData) {
  const storeId = String(formData.get("store_id") || "");
  const reviewId = String(formData.get("review_id") || "");
  const reply = String(formData.get("reply") || "");

  const { supabase, uid } = await requireSeller(
    `/dashboard/seller/stores/${storeId}/reviews`
  );

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("owner_id", uid)
    .maybeSingle();

  if (!store) {
    redirect("/dashboard/seller/stores?error=store_introuvable");
  }

  /* L'avis doit bien concerner cette boutique. */
  const { data: review } = await supabase
    .from("reviews")
    .select("id, store_id")
    .eq("id", reviewId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!review) {
    redirect(
      `/dashboard/seller/stores/${storeId}/reviews?error=${encodeURIComponent(
        "Cet avis ne concerne pas cette boutique."
      )}`
    );
  }

  const result = await replyToReview(reviewId, reply);

  const base = `/dashboard/seller/stores/${storeId}/reviews`;

  if (!result.ok) {
    redirect(`${base}?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath(base);
  redirect(`${base}?replied=1`);
}
