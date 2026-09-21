"use server";

/*
  ACTION : déposer un avis sur un article commandé.

  L'identité du client et la propriété de la commande ne viennent pas du
  formulaire : Mercur les vérifie à partir du jeton de session. Un client
  ne peut donc pas noter la commande d'un autre en modifiant sa requête.

  L'avis part « en attente ». Il n'est visible de personne tant que MACHÉ
  ne l'a pas publié, et l'écran le dit — un avis qui disparaît sans
  explication passe pour un avis perdu.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { submitProductReview } from "@/lib/medusa/customer";

export async function submitReviewAction(formData: FormData) {
  const orderId = String(formData.get("order_id") || "").trim();
  const productId = String(formData.get("product_id") || "").trim();
  const rating = Number(formData.get("rating"));
  const note = String(formData.get("note") || "");

  const back = `/dashboard/buyer/orders/${encodeURIComponent(orderId)}`;

  if (!orderId || !productId) {
    redirect(`${back}?error=${encodeURIComponent("Article introuvable.")}`);
  }

  const result = await submitProductReview({ orderId, productId, rating, note });

  if (!result.ok) {
    redirect(`${back}?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath(back);

  redirect(
    `${back}?success=${encodeURIComponent(
      "Merci. Votre avis sera publié après vérification par MACHÉ."
    )}`
  );
}
