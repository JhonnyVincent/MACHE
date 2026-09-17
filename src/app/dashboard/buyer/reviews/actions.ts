"use server";

/*
  ACTION : dépôt d'un avis client

  L'autorisation ne vient pas du formulaire mais de la base : lib/reviews
  relit la ligne de commande, vérifie qu'elle appartient au compte connecté
  et que la commande est livrée.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBuyer } from "@/lib/buyer";
import { createReview } from "@/lib/reviews";

export async function submitReviewAction(formData: FormData) {
  const { uid } = await requireBuyer("/dashboard/buyer/reviews");

  const result = await createReview(uid, {
    orderItemId: String(formData.get("order_item_id") || ""),
    rating: Number(formData.get("rating") || 0),
    title: String(formData.get("title") || ""),
    body: String(formData.get("body") || ""),
  });

  if (!result.ok) {
    redirect(`/dashboard/buyer/reviews?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath("/dashboard/buyer/reviews");
  redirect("/dashboard/buyer/reviews?published=1");
}
