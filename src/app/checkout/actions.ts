"use server";

/*
  ACTIONS : tunnel de commande.

  Aucun montant, aucun statut de paiement n'est décidé ici : tout vient de
  Medusa. Une commande n'est jamais marquée payée depuis le navigateur.
*/

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  setCustomerDetails, chooseShippingOption, placeOrder,
} from "@/lib/medusa/checkout";

const CONFIRMATION_COOKIE = "mache_last_order";

function back(error?: string): never {
  revalidatePath("/checkout");
  redirect(error ? `/checkout?error=${encodeURIComponent(error)}` : "/checkout");
}

export async function saveAddressAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();

  if (!email || !email.includes("@")) {
    back("Indiquez une adresse e-mail valide : elle sert à vous tenir informé de la commande.");
  }

  const required = {
    firstName: String(formData.get("first_name") || "").trim(),
    lastName: String(formData.get("last_name") || "").trim(),
    address1: String(formData.get("address_1") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    countryCode: String(formData.get("country_code") || "").trim(),
  };

  for (const [field, value] of Object.entries(required)) {
    if (!value) {
      back(`Un champ obligatoire est vide (${field}).`);
    }
  }

  /*
    Le téléphone est exigé, pas facultatif : le livreur appelle. Sans lui,
    une adresse incomplète devient une livraison échouée.
  */
  const result = await setCustomerDetails(email, {
    ...required,
    address2: String(formData.get("address_2") || "").trim() || undefined,
    province: String(formData.get("province") || "").trim() || undefined,
    postalCode: String(formData.get("postal_code") || "").trim() || undefined,
  });

  if (!result.ok) back(result.reason);

  back();
}

export async function chooseShippingAction(formData: FormData) {
  const optionId = String(formData.get("option_id") || "");

  const result = await chooseShippingOption(optionId);

  if (!result.ok) back(result.reason);

  back();
}

export async function placeOrderAction() {
  const result = await placeOrder();

  if (!result.ok) back(result.reason);

  /*
    Le récapitulatif est déposé dans un cookie court plutôt que passé dans
    l'URL : un montant lu depuis l'adresse de la page serait modifiable
    par le visiteur, et afficherait un total qui n'a jamais existé.
  */
  const store = await cookies();

  store.set(CONFIRMATION_COOKIE, JSON.stringify(result.data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });

  revalidatePath("/cart");
  redirect("/checkout/success");
}
