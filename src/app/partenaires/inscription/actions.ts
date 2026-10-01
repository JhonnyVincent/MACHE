"use server";

/*
  ACTION : un partenaire de services demande à figurer sur MACHE.

  Rien n'est public avant l'approbation par l'équipe. L'action relaie au
  backend, qui nettoie les champs et prévient l'équipe par e-mail.
*/

import { redirect } from "next/navigation";
import { registerPartner } from "@/lib/medusa/partners-db";
import { spamCheck } from "@/lib/anti-spam";

const FIELDS = [
  "name", "category", "description", "location", "logo", "banner", "website",
  "whatsapp", "phone", "facebook", "instagram", "contact_name", "contact_email",
];

export async function registerPartnerAction(formData: FormData) {
  const blocked = await spamCheck("boutique", formData);

  if (blocked) redirect(`/partenaires/inscription?error=${encodeURIComponent(blocked)}`);

  const body: Record<string, string> = {};

  for (const field of FIELDS) body[field] = String(formData.get(field) || "").trim();

  const result = await registerPartner(body);

  if (!result.ok) redirect(`/partenaires/inscription?error=${encodeURIComponent(result.reason)}`);

  redirect("/partenaires/inscription?merci=1");
}
