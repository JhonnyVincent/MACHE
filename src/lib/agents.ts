/*
  La vérification publique d'un agent MACHÉ.

  Ce fichier portait aussi l'espace agent : contrôle d'accès par rôle
  Supabase, statuts d'expédition, transitions autorisées. Tout cela est
  parti — l'espace agent est passé sur Medusa, où un agent est un client
  à qui s'ajoute une fonction, et non un rôle à part.

  Ce qui restait ici après ce déménagement ne servait plus à personne :
  `requireAgent` interrogeait un projet Supabase supprimé, et les
  libellés d'expédition n'étaient plus lus nulle part. Du code mort qui
  parle à une base disparue est un piège pour qui le rebranchera un
  jour sans savoir.

  Ne reste que ce qui est réellement utilisé : la vérification d'un code
  d'agent, celle qu'on consulte sur le pas de sa porte avant de remettre
  de l'argent à un inconnu. Elle interroge Medusa, et l'habilitation
  vient des groupes de clients — que seule l'administration modifie.
*/

import { medusaFetch } from "@/lib/medusa/client";
import { reportOutage } from "@/lib/medusa/outage";

export type AgentStatus = "pending" | "active" | "suspended" | "revoked";

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  pending: "En cours d'habilitation",
  active: "Agent habilité",
  suspended: "Habilitation suspendue",
  revoked: "Habilitation retirée",
};

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
/*
  Vérification publique d'un code agent, sur Medusa.

  Elle lisait Supabase, dont le projet a été supprimé : la page
  répondait « impossible à vérifier » à tout le monde, à l'instant
  précis où quelqu'un hésite à remettre de l'argent liquide.

  Ce qui fait foi, côté backend

  L'appartenance à un groupe de clients, que seule l'administration
  peut modifier. Un agent est un CLIENT de MACHÉ à qui s'ajoute une
  fonction — point de relais, livreur, commercial — et non un
  administrateur.

  Vérifié en conditions réelles : un client qui écrit lui-même un code
  d'agent dans son champ libre — ce qu'il peut faire, c'est là que
  vivent ses favoris — obtient « inconnu », parce qu'il n'est dans
  aucun groupe.

  Les trois issues sont conservées telles quelles : « pas un agent » et
  « MACHÉ n'en sait rien » appellent le même geste, ne rien remettre,
  mais pas la même accusation.
*/
export async function verifyAgentCode(rawCode: string): Promise<AgentVerification> {
  const code = rawCode.trim().toUpperCase();

  if (!code) return { found: false };

  const result = await medusaFetch<{
    found?: boolean;
    display_name?: string;
    function?: string;
    zone?: string | null;
    phone_public?: string | null;
    trustworthy?: boolean;
    suspended?: boolean;
  }>("/store/agents/verify", { code }, { revalidate: 0 });

  if (!result.ok) {
    /*
      Une panne de lecture n'est pas une absence d'agent : on ne répond
      pas « inconnu » quand on n'a pas pu regarder.
    */
    reportOutage("vérification agent", result.reason);

    return { unavailable: true };
  }

  if (!result.data.found) return { found: false };

  const suspended = result.data.suspended === true;

  return {
    found: true,
    code,
    displayName: result.data.display_name ?? "Agent MACHÉ",
    /*
      Pas de photo : la route publique n'en rend pas. Une photo
      d'agent est une donnée personnelle, et la publier à qui essaie
      des codes au hasard constituerait un trombinoscope.
    */
    photoUrl: null,
    /* La fonction remplace la zone quand celle-ci n'est pas renseignée. */
    zone: result.data.zone ?? result.data.function ?? null,
    phonePublic: result.data.phone_public ?? null,
    status: suspended ? "suspended" : "active",
    validUntil: null,
    officialBadge: !suspended,
    expired: false,
    trustworthy: result.data.trustworthy === true,
  };
}
