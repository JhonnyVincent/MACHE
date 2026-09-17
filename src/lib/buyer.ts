/*
  Socle de l'espace client.

  Sert à :
  - vérifier qu'un compte est connecté avant d'afficher ses données ;
  - charger son profil une seule fois par page.

  Contrairement à l'espace vendeur, aucun rôle particulier n'est exigé : tout
  compte connecté a un espace client, y compris un vendeur qui achète.
*/

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente de traitement",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  completed: "Terminée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  failed: "Échouée",
};

export const ORDER_STATUS_TONES: Record<
  string,
  "success" | "warning" | "danger" | "neutral" | "info"
> = {
  pending: "warning",
  processing: "info",
  shipped: "info",
  delivered: "success",
  completed: "success",
  cancelled: "danger",
  refunded: "danger",
  failed: "danger",
  draft: "neutral",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  requires_action: "Action requise",
  authorized: "Autorisé",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
  partially_refunded: "Partiellement remboursé",
  cancelled: "Annulé",
  cash_on_delivery: "À la livraison",
};

export async function requireBuyer(nextPath = "/dashboard/buyer") {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const uid = userData.user.id;

  const { data: profile, error } = await supabase
    .from("users")
    .select("role, full_name, email, created_at")
    .eq("id", uid)
    .maybeSingle();

  if (error) {
    console.error("[buyer] profil:", error.message);
  }

  const displayName = profile?.full_name?.trim() || "Client";

  return {
    supabase,
    uid,
    email: profile?.email || userData.user.email || "",
    profile,
    role: String(profile?.role || ""),
    displayName,
    firstName: displayName.split(" ")[0],
  };
}
