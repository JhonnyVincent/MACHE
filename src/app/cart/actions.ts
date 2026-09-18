"use server";

/*
  ACTIONS : panier.

  Ces actions ne font que relayer vers src/lib/medusa/cart.ts, qui parle à
  Medusa. Aucun montant n'est calculé ici : le total du panier est celui
  que renvoie le backend, et lui seul.

  Le retour d'erreur passe par l'URL plutôt que par une exception : une
  quantité refusée pour rupture de stock est une information à montrer au
  client, pas une page d'erreur.
*/

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addOfferToCart, updateCartLine, removeCartLine } from "@/lib/medusa/cart";
import { safeInternalPath } from "@/lib/safe-url";

function back(target: string, error?: string): never {
  revalidatePath("/cart");

  redirect(error ? `${target}?error=${encodeURIComponent(error)}` : target);
}

export async function addToCartAction(formData: FormData) {
  const offerId = String(formData.get("offer_id") || "");
  const quantity = Number(formData.get("quantity") || 1);
  /* Le formulaire fournit ce chemin : il ne doit pas pouvoir sortir du site. */
  const returnTo = safeInternalPath(formData.get("return_to"), "/cart");

  const result = await addOfferToCart(offerId, quantity);

  if (!result.ok) back(returnTo, result.reason);

  back("/cart");
}

export async function updateCartLineAction(formData: FormData) {
  const lineId = String(formData.get("line_id") || "");
  const quantity = Number(formData.get("quantity") || 0);

  const result = await updateCartLine(lineId, quantity);

  if (!result.ok) back("/cart", result.reason);

  back("/cart");
}

export async function removeCartLineAction(formData: FormData) {
  const lineId = String(formData.get("line_id") || "");

  const result = await removeCartLine(lineId);

  if (!result.ok) back("/cart", result.reason);

  back("/cart");
}
