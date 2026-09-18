/*
  Socle de l'espace d'administration.

  Le rôle est relu en base à chaque page, jamais déduit de l'URL ni des
  métadonnées de session : `/dashboard/admin` est une adresse, pas une
  preuve. Un compte non habilité est renvoyé à son propre espace.
*/

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SUPER_ADMIN_LIMIT } from "@/lib/authz";

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  buyer: "Client",
  seller_individual: "Vendeur particulier",
  seller_business: "Vendeur Business",
  supplier: "Fournisseur",
  official_brand: "Marque officielle",
  agent: "Agent",
  partner: "Partenaire",
};

/*
  Rôles qu'un super administrateur peut attribuer depuis l'interface.

  `super_admin` n'y figure pas : le nombre de super administrateurs est
  plafonné et cette décision ne se prend pas d'un menu déroulant. Elle se
  fait en base, délibérément.
*/
export const ASSIGNABLE_ROLES = [
  "buyer",
  "seller_individual",
  "seller_business",
  "supplier",
  "official_brand",
  "agent",
  "partner",
  "admin",
] as const;

export { SUPER_ADMIN_LIMIT };

export async function requireAdmin(nextPath = "/dashboard/admin") {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("role, full_name, email")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    console.error("[admin] profil:", error.message);
  }

  if (!profile) redirect("/dashboard");

  const role = String(profile.role || "").trim();

  if (role !== "admin" && role !== "super_admin") {
    redirect("/dashboard");
  }

  const displayName = profile.full_name?.trim() || "Administration";

  return {
    supabase,
    uid: userData.user.id,
    role,
    isSuperAdmin: role === "super_admin",
    email: profile.email || userData.user.email || "",
    displayName,
    firstName: displayName.split(" ")[0],
  };
}

/*
  Garde d'écriture pour les actions serveur.

  Elle refait le même contrôle que requireAdmin : une action est une porte
  d'entrée à part entière, et rien ne garantit que l'appelant est passé par
  la page correspondante.
*/
export async function requireAdminForWrite(backTo: string, superOnly = false) {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=${encodeURIComponent(backTo)}`);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const role = String(profile?.role || "").trim();

  if (role !== "admin" && role !== "super_admin") {
    redirect("/dashboard");
  }

  if (superOnly && role !== "super_admin") {
    redirect(`${backTo}?error=${encodeURIComponent("Réservé au super administrateur.")}`);
  }

  return { supabase, uid: userData.user.id, role, isSuperAdmin: role === "super_admin" };
}
