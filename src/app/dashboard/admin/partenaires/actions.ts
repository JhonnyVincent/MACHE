"use server";

/*
  ACTIONS : gérer les partenaires de services.

  Approuver (ou rétablir), suspendre, exclure, supprimer, ajouter,
  corriger. Suspendre et exclure exigent un motif : une décision sans
  motif ne se justifie plus six mois plus tard. La session est
  revérifiée ici.
*/

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAdminUser, actOnPartner, createAdminPartner } from "@/lib/medusa/admin";
import { PARTNER_CATEGORIES } from "@/lib/partner-categories";

const PAGE = "/dashboard/admin/partenaires";

function done(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params).toString()}`);
}

function refresh() {
  revalidateTag("partners");
  revalidatePath("/partenaires");
  revalidatePath("/partenaires/[slug]", "page");
  revalidatePath(PAGE);
}

const FIELDS = [
  "name", "category", "description", "location", "logo", "banner", "website",
  "whatsapp", "phone", "facebook", "instagram", "contact_name", "contact_email",
];

function readFields(formData: FormData): Record<string, string> {
  const body: Record<string, string> = {};
  for (const field of FIELDS) body[field] = String(formData.get(field) || "").trim();
  return body;
}

export async function partnerActionAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const action = String(formData.get("action") || "");
  const reason = String(formData.get("reason") || "").trim();

  if (!id) done({ erreur: "Partenaire manquant." });
  if (!["approve", "suspend", "ban", "delete", "update"].includes(action)) done({ erreur: "Action inconnue." });

  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const extra = action === "update" ? readFields(formData) : reason ? { reason } : {};

  const result = await actOnPartner(id, action as "approve" | "suspend" | "ban" | "delete" | "update", extra);

  if (!result.ok) done({ erreur: result.reason });

  refresh();

  done({
    fait:
      action === "approve" ? "Partenaire approuvé (visible sur le site)."
      : action === "suspend" ? "Partenaire suspendu."
      : action === "ban" ? "Partenaire exclu."
      : action === "delete" ? "Partenaire supprimé."
      : "Fiche enregistrée.",
  });
}

export async function createPartnerAction(formData: FormData) {
  const user = await getAdminUser();

  if (!user) redirect("/dashboard/admin/connexion");

  const body = readFields(formData);

  if (!(PARTNER_CATEGORIES as readonly string[]).includes(body.category)) done({ erreur: "Choisissez une catégorie." });

  const result = await createAdminPartner(body);

  if (!result.ok) done({ erreur: result.reason });

  refresh();

  done({ fait: "Partenaire ajouté (visible sur le site)." });
}
