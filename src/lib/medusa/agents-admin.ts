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

  for (const group of result.data.customer_groups ?? []) {
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
        suspended: metadata.agent_suspended === true,
      });
    }
  }

  return { ok: true, data: agents };
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
  const existing = (customer.metadata as Raw) ?? {};

  const saved = await request(`/admin/customers/${customer.id}`, {
    method: "POST",
    body: {
      metadata: {
        ...existing,
        agent_code: code,
        agent_zone: input.zone,
        agent_phone_public: input.phonePublic,
        agent_suspended: false,
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
  const found = await request<{ customer?: Raw }>(
    `/admin/customers/${encodeURIComponent(customerId)}`
  );

  if (!found.ok) return found;

  const existing = (found.data.customer?.metadata as Raw) ?? {};

  const saved = await request(
    `/admin/customers/${encodeURIComponent(customerId)}`,
    {
      method: "POST",
      body: { metadata: { ...existing, agent_suspended: suspended } },
    }
  );

  if (!saved.ok) return saved;

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
