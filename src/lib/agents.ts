/*
  Socle de l'espace agent et de la vérification publique d'un agent.

  Un agent MACHÉ transporte des colis : il voit les expéditions qui lui
  sont assignées et fait avancer leur statut. Il ne voit ni le catalogue,
  ni les finances d'une boutique, ni les autres agents.

  La vérification publique (/verify-agent) lit la même table mais ne rend
  que ce qu'un agent montre déjà en se présentant : code, nom, zone,
  validité. Rien de ce qui touche à son compte n'en sort.
*/

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: "À prendre en charge",
  assigned: "Assignée",
  picked_up: "Colis récupéré",
  in_transit: "En route",
  delivered: "Livrée",
  failed: "Échec de livraison",
  cancelled: "Annulée",
};

export const SHIPMENT_STATUS_TONES: Record<
  string,
  "success" | "warning" | "danger" | "neutral" | "info"
> = {
  pending: "warning",
  assigned: "info",
  picked_up: "info",
  in_transit: "info",
  delivered: "success",
  failed: "danger",
  cancelled: "neutral",
};

/*
  Enchaînement autorisé des statuts, du point de vue de l'agent.

  Il est défini ici plutôt que dans la page : c'est une règle métier, et
  l'action serveur doit la vérifier sans faire confiance au bouton cliqué.
  Un agent ne peut pas déclarer « livrée » une expédition qu'il n'a jamais
  récupérée, ni revenir en arrière sur une livraison faite.
*/
export const AGENT_NEXT_STATUS: Record<string, string[]> = {
  assigned: ["picked_up", "failed"],
  picked_up: ["in_transit", "failed"],
  in_transit: ["delivered", "failed"],
};

export const AGENT_ACTION_LABELS: Record<string, string> = {
  picked_up: "J'ai récupéré le colis",
  in_transit: "Je pars en livraison",
  delivered: "Colis livré",
  failed: "Livraison impossible",
};

export type AgentStatus = "pending" | "active" | "suspended" | "revoked";

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  pending: "En cours d'habilitation",
  active: "Agent habilité",
  suspended: "Habilitation suspendue",
  revoked: "Habilitation retirée",
};

/*
  Contrôle d'accès de l'espace agent.

  Le rôle est relu en base, jamais pris dans les métadonnées de session :
  celles-ci sont modifiables côté client sur certains flux Supabase.
*/
export async function requireAgent(nextPath = "/dashboard/agent") {
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
    console.error("[agent] profil:", error.message);
  }

  if (!profile) {
    redirect("/dashboard");
  }

  if (String(profile.role || "").trim() !== "agent") {
    redirect("/dashboard");
  }

  /*
    La fiche d'agent peut ne pas exister : un compte peut avoir le rôle
    sans avoir encore été habilité. L'espace reste accessible et le dit,
    plutôt que de rejeter quelqu'un sans explication.
  */
  const { data: agentProfile } = await supabase
    .from("agent_profiles")
    .select("id, code, display_name, photo_url, zone, phone_public, status, valid_until, official_badge")
    .eq("user_id", uid)
    .maybeSingle();

  const displayName =
    agentProfile?.display_name?.trim() || profile.full_name?.trim() || "Agent";

  return {
    supabase,
    uid,
    email: profile.email || userData.user.email || "",
    profile,
    agent: agentProfile ?? null,
    displayName,
    firstName: displayName.split(" ")[0],
  };
}

export type AgentVerification =
  /*
    Trois issues, et non deux.

    « Introuvable » et « impossible à vérifier » ne veulent pas dire la
    même chose sur le pas d'une porte. La première dit que cette personne
    n'est pas un agent MACHÉ. La seconde dit que MACHÉ n'en sait rien.

    Les confondre ferait accuser un agent honnête, ou — bien pire —
    laisserait croire qu'un refus est un verdict alors que le service
    était simplement en panne. Dans les deux cas, la consigne reste la
    même : ne rien remettre. Mais la raison donnée doit être vraie.
  */
  | { found: false }
  | { unavailable: true }
  | {
      found: true;
      code: string;
      displayName: string;
      photoUrl: string | null;
      zone: string | null;
      phonePublic: string | null;
      status: AgentStatus;
      validUntil: string | null;
      officialBadge: boolean;
      expired: boolean;
      trustworthy: boolean;
    };

/*
  Vérification publique d'un code agent.

  Rend un verdict explicite plutôt qu'une fiche brute : un client sur le pas
  de sa porte n'a pas à interpréter un statut technique. Une habilitation
  expirée vaut « ne pas faire confiance », même si la ligne existe.
*/
export async function verifyAgentCode(rawCode: string): Promise<AgentVerification> {
  const code = rawCode.trim().toUpperCase();

  if (!code) return { found: false };

  /*
    Sans base de comptes, la page levait une exception serveur : un écran
    gris, à l'instant précis où quelqu'un hésite à remettre un colis.
  */
  if (!supabaseConfigured()) {
    console.warn("[verify-agent] base des agents non configurée");
    return { unavailable: true };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("agent_profiles")
    .select("code, display_name, photo_url, zone, phone_public, status, valid_until, official_badge")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    /*
      Une panne de lecture n'est pas une absence d'agent : on ne répond
      pas « inconnu » quand on n'a pas pu regarder.
    */
    console.error("[verify-agent]", error.message);
    return { unavailable: true };
  }

  if (!data) return { found: false };

  const status = String(data.status || "pending") as AgentStatus;

  const expired = Boolean(
    data.valid_until && new Date(data.valid_until).getTime() < Date.now()
  );

  return {
    found: true,
    code: data.code,
    displayName: data.display_name,
    photoUrl: data.photo_url ?? null,
    zone: data.zone ?? null,
    phonePublic: data.phone_public ?? null,
    status,
    validUntil: data.valid_until ?? null,
    officialBadge: Boolean(data.official_badge),
    expired,
    trustworthy: status === "active" && !expired,
  };
}
