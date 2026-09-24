/*
  L'espace agent, côté storefront.

  Un agent n'est pas un administrateur

  C'est un client de MACHÉ — il achète comme tout le monde — à qui
  s'ajoute une fonction : tenir un point de retrait, livrer, démarcher
  des commerçants. Il se connecte donc avec SON COMPTE CLIENT, et son
  espace est un écran de plus dans ce compte.

  D'où vient l'habilitation

  Des groupes de clients, que seule l'administration modifie. Le
  backend le tranche ; ce fichier ne fait que transporter la réponse.
  Décider ici « ce client a un code agent dans son champ libre, donc
  c'est un agent » rendrait la fonction auto-attribuable : le champ
  libre d'un client, c'est le client qui l'écrit.

  Ce que ce fichier ne verra jamais passer

  Le code de remise. Il est montré au seul acheteur. L'agent le
  saisit, il ne le lit pas — c'est ce qui fait qu'une confirmation
  prouve une rencontre.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";
import { backendTimeoutSignal, isTimeout, TIMEOUT_MESSAGE } from "./timeout";

const TOKEN_COOKIE = "mache_customer_token";

type Raw = Record<string, unknown>;

export type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

export type AgentCard = {
  function: string;
  slug: string;
  code: string | null;
  zone: string | null;
  suspended: boolean;
};

export type AgentDelivery = {
  id: string;
  displayId: number;
  orderId: string;
  method: "seller" | "agent" | "relay" | "carrier";
  status: string;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientAddress: string | null;
  recipientDepartment: string | null;
  relayPointId: string | null;
  carrierName: string | null;
  trackingNumber: string | null;
  attemptsLeft: number;
  failureReason: string | null;
  confirmedAt: string | null;
  createdAt: string | null;
};

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<Result<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value ?? null;

  if (!token) {
    return { ok: false, reason: "Vous n'êtes pas connecté." };
  }

  try {
    const response = await fetch(`${configured.config.url}${path}`, {
      signal: backendTimeoutSignal(),
      method: init.method ?? "GET",
      headers: {
        "x-publishable-api-key": configured.config.key,
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as Raw;

    if (!response.ok) {
      return {
        ok: false,
        reason: str(payload.message) ?? `Le backend a répondu ${response.status}.`,
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    if (isTimeout(error)) return { ok: false, reason: TIMEOUT_MESSAGE };

    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `Backend injoignable : ${message}` };
  }
}

function mapDelivery(raw: Raw): AgentDelivery {
  return {
    id: String(raw.id),
    displayId: Number(raw.display_id) || 0,
    orderId: String(raw.order_id ?? ""),
    method: (str(raw.method) ?? "seller") as AgentDelivery["method"],
    status: str(raw.status) ?? "pending",
    recipientName: str(raw.recipient_name),
    recipientPhone: str(raw.recipient_phone),
    recipientAddress: str(raw.recipient_address),
    recipientDepartment: str(raw.recipient_department),
    relayPointId: str(raw.relay_point_id),
    carrierName: str(raw.carrier_name),
    trackingNumber: str(raw.tracking_number),
    attemptsLeft: Number(raw.attempts_left ?? 0),
    failureReason: str(raw.failure_reason),
    confirmedAt: str(raw.confirmed_at),
    createdAt: str(raw.created_at),
  };
}

/*
  Trois réponses distinctes, et elles doivent le rester.

  `null` = ce compte n'est pas un agent. Une erreur = on n'a pas pu
  savoir. Les confondre afficherait « vous n'êtes pas agent » à un agent
  dont le backend est simplement en panne, et il croirait avoir perdu
  son habilitation.
*/
export async function getAgentCard(): Promise<Result<AgentCard | null>> {
  const result = await request<{ agent: Raw | null }>("/store/agents/me");

  if (!result.ok) return result;

  const agent = result.data.agent;

  if (!agent) return { ok: true, data: null };

  return {
    ok: true,
    data: {
      function: str(agent.function) ?? "Agent MACHÉ",
      slug: str(agent.slug) ?? "",
      code: str(agent.code),
      zone: str(agent.zone),
      suspended: agent.suspended === true,
    },
  };
}

export async function getAgentDeliveries(
  scope: "open" | "all" = "open"
): Promise<Result<{ card: AgentCard; deliveries: AgentDelivery[]; relayPointIds: string[] }>> {
  const result = await request<{
    agent: Raw;
    deliveries: Raw[];
    relay_point_ids: string[];
  }>(`/store/agents/deliveries?scope=${scope}`);

  if (!result.ok) return result;

  const agent = result.data.agent ?? {};

  return {
    ok: true,
    data: {
      card: {
        function: str(agent.function) ?? "Agent MACHÉ",
        slug: "",
        code: str(agent.code),
        zone: str(agent.zone),
        suspended: agent.suspended === true,
      },
      deliveries: (result.data.deliveries ?? []).map(mapDelivery),
      relayPointIds: result.data.relay_point_ids ?? [],
    },
  };
}

export async function advanceAgentDelivery(
  id: string,
  status: string,
  reason?: string
): Promise<Result<AgentDelivery>> {
  const result = await request<{ delivery: Raw }>(
    `/store/agents/deliveries/${encodeURIComponent(id)}`,
    { method: "POST", body: { status, reason } }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapDelivery(result.data.delivery) };
}

/*
  La saisie du code. L'agent l'obtient de l'acheteur au moment de la
  remise — c'est tout l'intérêt : il ne peut pas confirmer de chez lui.
*/
export async function confirmAgentDelivery(
  id: string,
  code: string,
  note?: string
): Promise<Result<AgentDelivery>> {
  const result = await request<{ delivery: Raw }>(
    `/store/agents/deliveries/${encodeURIComponent(id)}/confirm`,
    { method: "POST", body: { code, note } }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapDelivery(result.data.delivery) };
}

/* Les libellés, écrits une fois : deux écrans qui les reformulent finissent
   par ne plus dire la même chose. */
export const DELIVERY_STATUS: Record<string, string> = {
  pending: "À prendre en charge",
  assigned: "Pris en charge",
  in_transit: "En route",
  ready_for_pickup: "Au point de retrait",
  delivered: "Remis",
  failed: "Échec",
  cancelled: "Annulé",
};

export const DELIVERY_METHOD: Record<string, string> = {
  seller: "Le vendeur livre",
  agent: "Agent MACHÉ",
  relay: "Point de retrait",
  carrier: "Transporteur extérieur",
};

/*
  Ce que l'agent peut faire ensuite. Reproduit les transitions du
  backend, qui reste l'arbitre : ce tableau sert à ne PAS afficher un
  bouton qui serait refusé, pas à autoriser quoi que ce soit.
*/
export const AGENT_NEXT: Record<string, { status: string; label: string }[]> = {
  pending: [{ status: "assigned", label: "J'ai pris le colis" }],
  assigned: [{ status: "in_transit", label: "Je pars livrer" }],
  in_transit: [{ status: "ready_for_pickup", label: "Déposé au point de retrait" }],
  ready_for_pickup: [],
  failed: [{ status: "in_transit", label: "Je réessaie" }],
};
