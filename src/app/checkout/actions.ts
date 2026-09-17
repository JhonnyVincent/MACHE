"use server";

/*
  ACTION : validation d'une commande

  Sert à :
  - recevoir le panier du navigateur et les coordonnées de livraison ;
  - déléguer la validation et l'enregistrement à lib/orders ;
  - rediriger vers la confirmation, ou revenir au tunnel avec l'erreur.

  Le panier vit dans le navigateur (localStorage) : il arrive donc dans le
  formulaire. Seuls les identifiants et les quantités en sont retenus — tout
  le reste est relu en base côté serveur.
*/

import { redirect } from "next/navigation";
import { createOrder, type CartLine } from "@/lib/orders";

function parseLines(raw: string): CartLine[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => ({
        productId: String(entry?.id ?? entry?.productId ?? ""),
        quantity: Number(entry?.quantity ?? 0),
      }))
      .filter((line) => line.productId && line.quantity > 0);
  } catch {
    return [];
  }
}

export async function placeOrderAction(formData: FormData) {
  const lines = parseLines(String(formData.get("cart") || "[]"));

  const result = await createOrder({
    lines,
    fullName: String(formData.get("full_name") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    line1: String(formData.get("line1") || ""),
    line2: String(formData.get("line2") || ""),
    city: String(formData.get("city") || ""),
    zoneSlug: String(formData.get("zone") || ""),
    instructions: String(formData.get("instructions") || ""),
    paymentMethod: String(formData.get("payment_method") || ""),
    saveAddress: formData.get("save_address") === "on",
  });

  if (!result.ok) {
    const params = new URLSearchParams({ error: result.code, message: result.message });

    if (result.details?.length) {
      params.set("details", result.details.slice(0, 5).join(" • "));
    }

    redirect(`/checkout?${params.toString()}`);
  }

  const params = new URLSearchParams({
    ref: result.reference,
    total: String(result.total),
    items: String(result.itemCount),
    stores: String(result.storeCount),
  });

  if (result.shippingPending) params.set("shipping", "pending");

  redirect(`/checkout/success?${params.toString()}`);
}
