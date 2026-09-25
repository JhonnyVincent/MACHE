/*
  LE SUIVI DE L'ACHETEUR.

  C'est le seul endroit du site où le CODE DE REMISE s'affiche, et tout
  le module s'organise autour de ce fait : celui qui livre ne le voit
  jamais. Pour le saisir, il doit l'avoir obtenu de l'acheteur — donc
  l'avoir rencontré. C'est là, et nulle part ailleurs, que se situe la
  preuve.

  DEUX FAÇONS D'ÊTRE AUTORISÉ

  Le client connecté propriétaire de la livraison, ou le porteur du
  jeton remis par le vendeur. Le jeton existe parce qu'on peut acheter
  sans compte : sans lui, un acheteur sans compte n'aurait aucun moyen
  de lire son propre code, et aucune livraison ne pourrait jamais être
  confirmée.

  UN IDENTIFIANT INCONNU ET UN JETON FAUX DONNENT LA MÊME RÉPONSE

  Le backend répond 404 aux deux. Les distinguer dirait à qui essaie
  des identifiants lesquels existent, et il ne resterait plus qu'à
  chercher le jeton. Cette page ne cherche donc pas à être plus
  précise que lui.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";
import { backendTimeoutSignal, isTimeout, TIMEOUT_MESSAGE } from "./timeout";

const TOKEN_COOKIE = "mache_customer_token";

type Raw = Record<string, unknown>;
type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export type TrackedDelivery = {
  id: string;
  orderId: string;
  status: string;
  method: string;
  /*
    Le code à donner à la personne qui livre. `null` quand il n'y a
    rien à donner : livraison terminée, annulée, ou confiée à un
    transporteur extérieur — dont le livreur ne connaît pas MACHÉ et ne
    pourrait rien en faire.
  */
  code: string | null;
  recipientName: string | null;
  recipientAddress: string | null;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  confirmedAt: string | null;
  confirmationNote: string | null;
  createdAt: string | null;
};

function map(raw: Raw): TrackedDelivery {
  return {
    id: str(raw.id) ?? "",
    orderId: str(raw.order_id) ?? "",
    status: str(raw.status) ?? "pending",
    method: str(raw.method) ?? "seller",
    code: str(raw.code),
    recipientName: str(raw.recipient_name),
    recipientAddress: str(raw.recipient_address),
    carrierName: str(raw.carrier_name),
    trackingNumber: str(raw.tracking_number),
    trackingUrl: str(raw.tracking_url),
    confirmedAt: str(raw.confirmed_at),
    confirmationNote: str(raw.confirmation_note),
    createdAt: str(raw.created_at),
  };
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<Result<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const headers: Record<string, string> = {
    "x-publishable-api-key": configured.config.key,
    "content-type": "application/json",
    accept: "application/json",
  };

  /*
    Le jeton du client connecté est joint quand il existe. Il n'est pas
    exigé : un acheteur sans compte passe par le jeton de suivi, et
    c'est précisément le cas que ce module doit servir.
  */
  const store = await cookies();
  const session = store.get(TOKEN_COOKIE)?.value;

  if (session) headers.authorization = `Bearer ${session}`;

  try {
    const response = await fetch(`${configured.config.url}${path}`, {
      signal: backendTimeoutSignal(),
      method: init.method ?? "GET",
      headers,
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

export async function trackDelivery(
  id: string,
  token?: string | null
): Promise<Result<TrackedDelivery>> {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";

  const result = await request<{ delivery?: Raw }>(
    `/store/deliveries/${encodeURIComponent(id)}${query}`
  );

  if (!result.ok) return result;

  return { ok: true, data: map(result.data.delivery ?? {}) };
}

/*
  L'acheteur constate la réception.

  Réservé aux colis confiés à un TRANSPORTEUR EXTÉRIEUR : pour ceux-là,
  et seulement ceux-là, aucun code MACHÉ ne peut être saisi à la
  remise, puisque le livreur du transporteur ne connaît pas MACHÉ. Le
  constat de l'acheteur est alors la seule information disponible, et
  il est enregistré comme déclaratif — non prouvé.

  Pour tous les autres, le backend refuse : la confirmation passe par
  le code, et c'est ce qui lui donne sa valeur.
*/
export async function confirmReceipt(
  id: string,
  token: string | null,
  note?: string | null
): Promise<Result<TrackedDelivery>> {
  const result = await request<{ delivery?: Raw }>(
    `/store/deliveries/${encodeURIComponent(id)}`,
    { method: "POST", body: { token: token || undefined, note: note || null } }
  );

  if (!result.ok) return result;

  return { ok: true, data: map(result.data.delivery ?? {}) };
}

export const TRACKING_STATUS_LABELS: Record<string, string> = {
  pending: "Le vendeur prépare votre colis",
  assigned: "Confié à la personne qui livre",
  in_transit: "En route",
  ready_for_pickup: "Arrivé — à retirer",
  delivered: "Remis",
  failed: "La remise a échoué",
  cancelled: "Annulée",
};

export const TRACKING_METHOD_LABELS: Record<string, string> = {
  seller: "Le vendeur livre lui-même",
  agent: "Un agent MACHÉ livre",
  relay: "À retirer en point de retrait",
  carrier: "Confié à un transporteur",
};
