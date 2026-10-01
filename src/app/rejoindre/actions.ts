"use server";

/*
  ACTION : se pré-inscrire comme vendeur, grossiste ou marque.

  La pré-inscription n'ouvre pas de boutique : elle met la personne sur
  la liste de départ. Elle arrive dans la messagerie de MACHE (catégorie
  « Ma boutique ») et l'équipe est prévenue par e-mail ; on recontacte
  ensuite pour ouvrir la boutique. Rien n'est promis de plus : ni date
  d'ouverture, ni tarif.
*/

import { redirect } from "next/navigation";
import { openThread } from "@/lib/medusa/support";
import { isControlFlow, reasonOf } from "@/lib/safe-action";
import { reportOutage } from "@/lib/medusa/outage";
import { spamCheck } from "@/lib/anti-spam";

const KINDS: Record<string, string> = {
  vendeur: "Vendeur",
  grossiste: "Grossiste",
  marque: "Marque",
};

function fail(message: string): never {
  redirect(`/rejoindre?error=${encodeURIComponent(message)}`);
}

export async function preRegisterAction(formData: FormData) {
  const blocked = await spamCheck("boutique", formData);

  if (blocked) fail(blocked);

  const kind = String(formData.get("kind") || "");
  const name = String(formData.get("name") || "").trim().slice(0, 200);
  const shop = String(formData.get("shop") || "").trim().slice(0, 200);
  const email = String(formData.get("email") || "").trim().toLowerCase().slice(0, 254);
  const phone = String(formData.get("phone") || "").trim().slice(0, 60);
  const city = String(formData.get("city") || "").trim().slice(0, 120);
  const products = String(formData.get("products") || "").trim().slice(0, 1500);
  const minimum = String(formData.get("minimum") || "").trim().slice(0, 200);
  /* Sondage, facultatif : sert à améliorer MACHE avant l'ouverture. */
  const channel = String(formData.get("channel") || "").trim().slice(0, 100);
  const wish = String(formData.get("wish") || "").trim().slice(0, 800);
  const worry = String(formData.get("worry") || "").trim().slice(0, 800);

  if (!KINDS[kind]) fail("Choisissez : vendeur, grossiste ou marque.");
  if (!name) fail("Indiquez votre nom.");
  if (!email.includes("@")) fail("Indiquez une adresse e-mail valide.");
  if (!phone) fail("Indiquez un numéro (WhatsApp de préférence) pour que nous puissions vous joindre.");
  if (products.length < 5) fail("Dites-nous en quelques mots ce que vous vendez.");

  const message = [
    `Type : ${KINDS[kind]}`,
    shop ? `Boutique / entreprise : ${shop}` : null,
    `Ville / pays : ${city || "non indiqué"}`,
    `Téléphone / WhatsApp : ${phone}`,
    kind === "grossiste" && minimum ? `Quantité minimale : ${minimum}` : null,
    "",
    `Produits : ${products}`,
    "",
    "Sondage",
    `Vend aujourd'hui : ${channel || "non indiqué"}`,
    `Ce qui lui ferait rejoindre MACHE : ${wish || "non indiqué"}`,
    `Ce qui l'inquiète : ${worry || "non indiqué"}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  try {
    const result = await openThread({
      fromName: name,
      fromEmail: email,
      fromPhone: phone,
      subject: `Pré-inscription ${KINDS[kind].toLowerCase()} : ${shop || name}`,
      category: "boutique",
      message,
    });

    if (!result.ok) fail(result.reason);
  } catch (error) {
    if (isControlFlow(error)) throw error;

    reportOutage("pré-inscription vendeur", reasonOf(error));

    fail("Votre demande n'est pas partie. Réessayez dans quelques minutes.");
  }

  redirect("/rejoindre?merci=1");
}
