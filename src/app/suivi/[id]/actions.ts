"use server";

/*
  ACTION : l'acheteur constate la réception d'un colis confié à un
  TRANSPORTEUR EXTÉRIEUR.

  Pourquoi seulement ceux-là

  Pour tous les autres acheminements, la remise se prouve par le code
  que l'acheteur donne à la personne qui livre. Le livreur d'un
  transporteur extérieur, lui, ne connaît pas MACHÉ et ne peut rien
  saisir. Pour ces colis, et pour eux seuls, le constat de l'acheteur
  est la seule information disponible.

  Elle est enregistrée comme DÉCLARATIVE et non prouvée — le backend
  écrit `confirmed_by: "customer"` — pour qu'un litige sache de quoi il
  parle. Le backend refuse ce constat pour toute autre méthode : c'est
  ce qui empêche de contourner le code.
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { confirmReceipt } from "@/lib/medusa/delivery-tracking";
import { isControlFlow, reasonOf } from "@/lib/safe-action";

export async function confirmReceiptAction(formData: FormData) {
  const id = String(formData.get("delivery_id") || "").trim();
  const token = String(formData.get("jeton") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!id) redirect("/");

  const page = `/suivi/${encodeURIComponent(id)}`;

  const search = new URLSearchParams();

  if (token) search.set("jeton", token);

  try {
    const result = await confirmReceipt(id, token || null, note);

    if (!result.ok) {
      search.set("erreur", result.reason);
      redirect(`${page}?${search.toString()}`);
    }

    revalidatePath(page);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    search.set("erreur", reasonOf(error));
    redirect(`${page}?${search.toString()}`);
  }

  search.set("fait", "Réception enregistrée. Merci.");
  redirect(`${page}?${search.toString()}`);
}
