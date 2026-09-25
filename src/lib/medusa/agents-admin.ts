/*
  Les agents MACHÉ, côté administration.

  Qui sont-ils

  Des CLIENTS de MACHÉ — ils achètent comme tout le monde — à qui
  s'ajoute une fonction : tenir un point de relais, livrer, ou démarcher
  des commerçants. Ce ne sont pas des administrateurs, et ils ne
  s'authentifient pas comme tels.

  Ce qui fait d'un client un agent

  Son appartenance à un GROUPE DE CLIENTS, que seule l'administration
  peut modifier. Pas son champ libre : un client écrit son propre champ
  libre — c'est là que vivent ses favoris — et pourrait donc s'y
  déclarer agent. Vérifié en conditions réelles : un client qui s'écrit
  un code d'agent obtient « inconnu » à la vérification publique.

  Le champ libre sert pour ce qui n'engage personne : le code de la
  carte, la zone, un téléphone publié exprès. Un agent qui modifierait
  son propre code ne romprait que sa propre vérification.
*/

import { cookies } from "next/headers";
import crypto from "crypto";
import { getMedusaConfig } from "./config";
import {
  backendTimeoutSignal,
  isTimeout,
  TIMEOUT_MESSAGE,
} from "./timeout";

const TOKEN_COOKIE = "mache_admin_token";

/*
  L'ÉTIQUETTE DU GROUPE DES AGENTS SUSPENDUS.

  Sa source de vérité est `backend/packages/api/src/api/agent-identity.ts`
  — c'est le backend qui applique la suspension. Elle est recopiée ici
  parce que le `tsconfig` du site exclut `backend/`, et qu'importer ce
  dossier ferait entrer les dépendances de Medusa dans la construction
  du site pour lire une chaîne de caractères.

  Une divergence entre les deux serait silencieuse et grave : le site
  écrirait une suspension dans un groupe que le backend ne regarde pas,
  l'écran afficherait « suspendu », et l'agent continuerait de
  confirmer des livraisons. Un test compare donc les deux fichiers
  (`npm run test:agents`).
*/
const SUSPENDED_MARKER = "mache_agent_suspended";

type Raw = Record<string, unknown>;
type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/* Les trois fonctions, et le groupe qui porte chacune. */
export const AGENT_FUNCTIONS = [
  { slug: "mache-point-relais", label: "Point de relais" },
  { slug: "mache-livreur", label: "Livreur" },
  { slug: "mache-commercial", label: "Commercial" },
] as const;

export type AgentFunctionSlug = (typeof AGENT_FUNCTIONS)[number]["slug"];

export function functionLabel(slug: string): string {
  return (
    AGENT_FUNCTIONS.find((entry) => entry.slug === slug)?.label ?? "Agent"
  );
}

export type Agent = {
  customerId: string;
  email: string;
  name: string;
  code: string | null;
  functionSlug: string;
  functionLabel: string;
  zone: string | null;
  phonePublic: string | null;
  suspended: boolean;
};

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<Result<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;

  if (!token) return { ok: false, reason: "Session expirée." };

  try {
    const response = await fetch(`${configured.config.url}${path}`, {
      method: init.method ?? "GET",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: backendTimeoutSignal(),
    });

    const payload = (await response.json().catch(() => ({}))) as Raw;

    if (!response.ok) {
      return {
        ok: false,
        reason:
          str(payload.message) ?? `Le backend a répondu ${response.status}.`,
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    if (isTimeout(error)) return { ok: false, reason: TIMEOUT_MESSAGE };

    const message = error instanceof Error ? error.message : String(error);

    return { ok: false, reason: `Backend injoignable : ${message}` };
  }
}

/*
  Le code de la carte, tiré au hasard.

  Il n'est PAS saisi par l'administration, et ce n'est pas un détail :
  un code choisi à la main suit toujours une suite — 0001, 0002 — qu'on
  devine en trois essais. Or ce code est ce qu'un client saisit avant de
  remettre de l'argent liquide à un inconnu.

  L'alphabet écarte les caractères qui se confondent à l'oral et à la
  lecture : ni O ni 0, ni I ni 1. Le code est lu sur une carte, souvent
  à voix haute, souvent dehors.
*/
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newAgentCode(): string {
  const bytes = crypto.randomBytes(6);

  const body = Array.from(bytes)
    .map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])
    .join("");

  return `MCH-${body.slice(0, 3)}-${body.slice(3)}`;
}

/*
  Tous les agents, groupe par groupe.

  On part des groupes : chercher parmi les clients ceux dont le champ
  libre porte un code reviendrait à faire confiance à ce champ libre.
*/
export async function fetchAgents(): Promise<Result<Agent[]>> {
  const result = await request<{ customer_groups?: Raw[] }>(
    "/admin/customer-groups?fields=id,name,metadata,*customers&limit=50"
  );

  if (!result.ok) return result;

  const agents: Agent[] = [];

  const groups = result.data.customer_groups ?? [];

  /*
    Qui MACHÉ a suspendu — une appartenance à un groupe, que seule
    l'administration modifie. Ce statut a vécu dans le champ libre du
    client, qui l'écrit lui-même : un agent suspendu n'avait qu'à s'y
    déclarer « non suspendu » pour se rétablir.
  */
  const suspendedIds = new Set<string>();

  for (const group of groups) {
    if ((group.metadata as Raw)?.[SUSPENDED_MARKER] !== true) continue;

    for (const customer of ((group.customers as Raw[]) ?? [])) {
      if (customer.id) suspendedIds.add(String(customer.id));
    }
  }

  for (const group of groups) {
    const slug = str((group.metadata as Raw)?.mache_agent_group);

    if (!slug) continue;

    for (const customer of ((group.customers as Raw[]) ?? [])) {
      const metadata = (customer.metadata as Raw) ?? {};

      agents.push({
        customerId: String(customer.id ?? ""),
        email: str(customer.email) ?? "",
        name:
          [str(customer.first_name), str(customer.last_name)]
            .filter(Boolean)
            .join(" ") || "Sans nom",
        code: str(metadata.agent_code),
        functionSlug: slug,
        functionLabel: functionLabel(slug),
        zone: str(metadata.agent_zone),
        phonePublic: str(metadata.agent_phone_public),
        /*
          Le champ libre est encore lu, mais il ne peut plus que
          SUSPENDRE : une suspension posée avant ce changement tient
          toujours, et personne ne se rétablit en s'écrivant
          « non suspendu ».
        */
        suspended:
          suspendedIds.has(String(customer.id ?? "")) ||
          metadata.agent_suspended === true,
      });
    }
  }

  return { ok: true, data: agents };
}

/*
  L'identifiant du groupe des suspendus.

  Il est désigné par une ÉTIQUETTE et non par son nom : un nom se
  renomme depuis le panneau, et la suspension cesserait de fonctionner
  sans que personne ne fasse le lien.
*/
async function suspendedGroupId(): Promise<Result<string>> {
  const result = await request<{ customer_groups?: Raw[] }>(
    "/admin/customer-groups?fields=id,metadata&limit=50"
  );

  if (!result.ok) return result;

  const group = (result.data.customer_groups ?? []).find(
    (entry) => (entry.metadata as Raw)?.[SUSPENDED_MARKER] === true
  );

  if (!group?.id) {
    return {
      ok: false,
      reason:
        "Le groupe « agents suspendus » n'existe pas encore. Lancez « npx medusa exec ./src/scripts/agent-groups.ts » sur le backend : sans ce groupe, une suspension ne tiendrait pas — l'écran afficherait « suspendu » et l'agent continuerait de livrer.",
    };
  }

  return { ok: true, data: String(group.id) };
}

/* Les identifiants des groupes, pour y ranger quelqu'un. */
async function groupIdFor(slug: string): Promise<Result<string>> {
  const result = await request<{ customer_groups?: Raw[] }>(
    "/admin/customer-groups?fields=id,metadata&limit=50"
  );

  if (!result.ok) return result;

  const group = (result.data.customer_groups ?? []).find(
    (entry) => str((entry.metadata as Raw)?.mache_agent_group) === slug
  );

  if (!group?.id) {
    return {
      ok: false,
      reason:
        "Le groupe correspondant n'existe pas encore. Il est créé au démarrage du backend.",
    };
  }

  return { ok: true, data: String(group.id) };
}

/*
  Faire d'un client existant un agent.

  On ne crée pas le compte : l'agent doit d'abord avoir un compte
  client, comme n'importe quel acheteur. C'est cohérent avec ce qu'il
  est — quelqu'un qui achète sur MACHÉ et rend un service en plus — et
  cela évite de créer un compte dont personne ne connaîtrait le mot de
  passe.
*/
export async function makeAgent(input: {
  email: string;
  functionSlug: string;
  zone: string | null;
  phonePublic: string | null;
}): Promise<Result<{ code: string; name: string }>> {
  const found = await request<{ customers?: Raw[] }>(
    `/admin/customers?q=${encodeURIComponent(input.email)}&limit=10`
  );

  if (!found.ok) return found;

  const customer = (found.data.customers ?? []).find(
    (entry) => str(entry.email)?.toLowerCase() === input.email.toLowerCase()
  );

  if (!customer?.id) {
    return {
      ok: false,
      reason:
        "Aucun compte client avec cette adresse. La personne doit d'abord créer son compte sur MACHÉ, comme un acheteur.",
    };
  }

  const group = await groupIdFor(input.functionSlug);

  if (!group.ok) return group;

  const code = newAgentCode();

  /*
    Le champ libre d'abord, le groupe ensuite. Dans cet ordre : si la
    seconde étape échoue, on a un client avec un code inutile — sans
    effet, puisqu'il n'est dans aucun groupe. L'ordre inverse
    produirait un agent reconnu sans code, donc invérifiable.
  */
  const existing = { ...((customer.metadata as Raw) ?? {}) };

  /*
    La suspension ne vit plus ici — elle est une appartenance à un
    groupe. Le champ libre est encore LU, et seulement pour ajouter une
    suspension : une valeur « true » qu'une habilitation précédente y
    aurait laissée ferait naître ce nouvel agent suspendu, sans que
    rien à l'écran ne l'explique. On l'efface donc.
  */
  delete existing.agent_suspended;

  const saved = await request(`/admin/customers/${customer.id}`, {
    method: "POST",
    body: {
      metadata: {
        ...existing,
        agent_code: code,
        agent_zone: input.zone,
        agent_phone_public: input.phonePublic,
      },
    },
  });

  if (!saved.ok) return saved;

  const added = await request(`/admin/customer-groups/${group.data}/customers`, {
    method: "POST",
    body: { add: [String(customer.id)] },
  });

  if (!added.ok) return added;

  return {
    ok: true,
    data: {
      code,
      name:
        [str(customer.first_name), str(customer.last_name)]
          .filter(Boolean)
          .join(" ") || input.email,
    },
  };
}

/*
  Suspendre ou réactiver un agent.

  La suspension laisse l'agent dans son groupe : la vérification
  publique répond alors qu'il est connu MAIS suspendu. Le retirer du
  groupe ferait répondre « inconnu », ce qui se lit comme une erreur de
  saisie et pousse à réessayer — alors que la bonne réponse est « ne
  lui remettez rien ».
*/
export async function setAgentSuspended(
  customerId: string,
  suspended: boolean
): Promise<Result<true>> {
  const group = await suspendedGroupId();

  if (!group.ok) return group;

  /*
    Ajouter au groupe, ou l'en retirer. C'est la seule écriture qui
    compte : elle n'est possible que depuis l'administration.
  */
  const moved = await request(
    `/admin/customer-groups/${group.data}/customers`,
    {
      method: "POST",
      body: suspended ? { add: [customerId] } : { remove: [customerId] },
    }
  );

  if (!moved.ok) return moved;

  /*
    Le champ libre est nettoyé au rétablissement.

    Il ne sert plus à suspendre — il est seulement encore LU, et
    seulement pour ajouter une suspension, jamais pour en lever une.
    Mais une valeur « true » qui y traînerait continuerait donc de
    suspendre l'agent après son rétablissement, et personne ne
    comprendrait pourquoi le bouton ne fait rien.
  */
  if (!suspended) {
    const found = await request<{ customer?: Raw }>(
      `/admin/customers/${encodeURIComponent(customerId)}`
    );

    if (found.ok) {
      const existing = { ...((found.data.customer?.metadata as Raw) ?? {}) };

      if ("agent_suspended" in existing) {
        delete existing.agent_suspended;

        await request(`/admin/customers/${encodeURIComponent(customerId)}`, {
          method: "POST",
          body: { metadata: existing },
        });
      }
    }
  }

  return { ok: true, data: true };
}

/*
  Retirer complètement la qualité d'agent : sortie du groupe, et code
  effacé. La personne reste cliente de MACHÉ — c'est sa fonction qu'on
  retire, pas son compte.
*/
export async function revokeAgent(
  customerId: string,
  functionSlug: string
): Promise<Result<true>> {
  const group = await groupIdFor(functionSlug);

  if (!group.ok) return group;

  const removed = await request(
    `/admin/customer-groups/${group.data}/customers`,
    { method: "POST", body: { remove: [customerId] } }
  );

  if (!removed.ok) return removed;

  const found = await request<{ customer?: Raw }>(
    `/admin/customers/${encodeURIComponent(customerId)}`
  );

  if (found.ok) {
    const existing = { ...((found.data.customer?.metadata as Raw) ?? {}) };

    delete existing.agent_code;
    delete existing.agent_zone;
    delete existing.agent_phone_public;
    delete existing.agent_suspended;

    await request(`/admin/customers/${encodeURIComponent(customerId)}`, {
      method: "POST",
      body: { metadata: existing },
    });
  }

  return { ok: true, data: true };
}
