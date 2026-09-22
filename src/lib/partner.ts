/*
  Socle de l'espace partenaire.

  Un partenaire est un prestataire de la marketplace — logistique, photo,
  comptabilité, import — rattaché à un ou plusieurs vendeurs par la table
  partner_vendors.

  Ce rattachement ne lui donne aujourd'hui aucun droit d'écriture sur
  l'activité d'un vendeur : aucune politique ne le prévoit, et il serait
  malvenu d'en inventer une. L'espace partenaire constate donc ses
  rattachements, et le dit clairement.
*/

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export const RELATION_LABELS: Record<string, string> = {
  service: "Prestation de service",
  logistics: "Logistique et livraison",
  photo: "Photographie produit",
  accounting: "Comptabilité",
  sourcing: "Import et sourcing",
  marketing: "Marketing",
};

export async function requirePartner(nextPath = "/dashboard/partner") {
  /*
    Sans Supabase, l'appel suivant lève et l'espace partenaire rend une
    erreur serveur au lieu de dire ce qui manque. Les appelants savent
    présenter cet état ; encore faut-il qu'ils y arrivent.
  */
  if (!supabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("role, full_name, email, created_at")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    console.error("[partner] profil:", error.message);
  }

  if (!profile) redirect("/dashboard");

  if (String(profile.role || "").trim() !== "partner") {
    redirect("/dashboard");
  }

  const displayName = profile.full_name?.trim() || "Partenaire";

  return {
    supabase,
    uid: userData.user.id,
    email: profile.email || userData.user.email || "",
    profile,
    displayName,
    firstName: displayName.split(" ")[0],
  };
}
