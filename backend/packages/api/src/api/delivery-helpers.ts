/*
  Ce que les routes de livraison partagent : fabriquer un code, le
  vérifier sans laisser fuiter sa valeur, et décider qui a le droit de
  voir quoi.

  Le partage qui structure tout ce fichier

  L'ACHETEUR voit le code — c'est lui qui le détient et le remet.
  Le VENDEUR, l'AGENT et le POINT DE RETRAIT ne le voient jamais.

  Si celui qui livre pouvait lire le code, il pourrait confirmer la
  livraison sans livrer, et la preuve ne prouverait plus rien. Deux
  fonctions de projection séparées valent mieux qu'un champ à ne pas
  oublier : on ne peut pas divulguer par distraction un champ qu'on
  n'écrit nulle part.
*/

import crypto from "crypto";

export const MAX_SHORT = 200;
export const MAX_NOTE = 1000;

/*
  Cinq essais. Un code à six caractères sur un alphabet de 32 offre un
  milliard de combinaisons : le compteur n'est pas là contre la force
  brute, il est là contre le vendeur qui essaie « les codes qu'il a
  vus passer » en espérant tomber juste.
*/
export const MAX_CODE_ATTEMPTS = 5;

/*
  Sans O/0 ni I/1. Ce code est lu à voix haute sur le pas d'une porte,
  souvent sur un écran fissuré : deux caractères qui se confondent
  transforment une livraison réussie en litige.
*/
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newDeliveryCode(): string {
  const bytes = crypto.randomBytes(6);
  let code = "";

  for (const byte of bytes) {
    code += ALPHABET[byte % ALPHABET.length];
  }

  return code;
}

export function newAccessToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function text(value: unknown, max = MAX_SHORT): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed ? trimmed.slice(0, max) : null;
}

/*
  Comparaison à durée constante, après normalisation de la casse et des
  espaces. Quelqu'un qui recopie un code met des espaces et hésite sur
  la casse ; le refuser pour cela ferait rater des livraisons réelles,
  sans rien protéger.
*/
export function codeMatches(expected: string, given: unknown): boolean {
  if (typeof given !== "string" || !expected) return false;

  const normalized = given.replace(/[\s-]/g, "").toUpperCase();

  const a = Buffer.from(expected.toUpperCase());
  const b = Buffer.from(normalized);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export function tokenMatches(expected: string, given: unknown): boolean {
  if (typeof given !== "string" || !expected) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(given);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export type DeliveryRow = {
  id: string;
  display_id: number;
  order_id: string;
  seller_id: string;
  customer_id: string | null;
  access_token: string;
  method: string;
  agent_customer_id: string | null;
  relay_point_id: string | null;
  carrier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_address: string | null;
  recipient_department: string | null;
  code: string;
  code_attempts: number;
  status: string;
  confirmed_by: string | null;
  confirmed_at: string | Date | null;
  confirmation_note: string | null;
  failure_reason: string | null;
  payout_state: string;
  created_at: string | Date;
  updated_at: string | Date;
};

/* Ce que tout le monde peut voir. Ni code, ni jeton, ni téléphone. */
function common(delivery: DeliveryRow) {
  return {
    id: delivery.id,
    display_id: delivery.display_id,
    order_id: delivery.order_id,
    seller_id: delivery.seller_id,
    method: delivery.method,
    status: delivery.status,
    relay_point_id: delivery.relay_point_id,
    carrier_name: delivery.carrier_name,
    tracking_number: delivery.tracking_number,
    tracking_url: delivery.tracking_url,
    recipient_name: delivery.recipient_name,
    recipient_department: delivery.recipient_department,
    confirmed_at: delivery.confirmed_at,
    confirmed_by: delivery.confirmed_by,
    failure_reason: delivery.failure_reason,
    created_at: delivery.created_at,
    updated_at: delivery.updated_at,
  };
}

/*
  Pour l'ACHETEUR. Lui seul reçoit le code, et seulement tant que la
  livraison est en cours : une fois remise, le code n'a plus d'usage et
  continuer à l'afficher ne ferait que le laisser traîner dans un
  historique.
*/
export function buyerDelivery(delivery: DeliveryRow) {
  const open = delivery.status !== "delivered" && delivery.status !== "cancelled";

  return {
    ...common(delivery),
    /*
      La méthode `carrier` n'a pas de code à remettre : le livreur d'un
      transporteur extérieur ne connaît pas MACHÉ. En afficher un
      pousserait l'acheteur à le réclamer à quelqu'un qui ne peut pas
      le saisir.
    */
    code: open && delivery.method !== "carrier" ? delivery.code : null,
    recipient_phone: delivery.recipient_phone,
    recipient_address: delivery.recipient_address,
    confirmation_note: delivery.confirmation_note,
  };
}

/*
  Pour le VENDEUR, l'AGENT, le POINT DE RETRAIT. Jamais le code — c'est
  la règle qui donne sa valeur à la confirmation. L'adresse et le
  téléphone y sont, en revanche : on ne livre pas sans savoir où aller.
*/
export function partyDelivery(delivery: DeliveryRow) {
  return {
    ...common(delivery),
    recipient_phone: delivery.recipient_phone,
    recipient_address: delivery.recipient_address,
    confirmation_note: delivery.confirmation_note,
    code_attempts: delivery.code_attempts,
    attempts_left: Math.max(0, MAX_CODE_ATTEMPTS - delivery.code_attempts),
    payout_state: delivery.payout_state,
  };
}

/*
  Les enchaînements permis, par méthode.

  Ils diffèrent parce que les trajets diffèrent réellement : un colis
  confié à un agent est d'abord REMIS à l'agent, un colis déposé en
  point de retrait ATTEND que le client vienne, et un colis que le
  vendeur porte lui-même ne fait ni l'un ni l'autre. Une seule liste
  pour les quatre laisserait un vendeur marquer « prêt au retrait » une
  livraison qu'il fait à domicile.

  `delivered` n'est dans aucune de ces listes, et c'est voulu : on n'y
  arrive pas en changeant un statut, mais en saisissant le code.
*/
export const NEXT_STATUS: Record<string, Record<string, string[]>> = {
  seller: {
    pending: ["in_transit", "cancelled"],
    in_transit: ["failed"],
    failed: ["in_transit"],
  },
  agent: {
    pending: ["assigned", "cancelled"],
    assigned: ["in_transit", "failed"],
    in_transit: ["failed"],
    failed: ["in_transit"],
  },
  relay: {
    pending: ["assigned", "cancelled"],
    assigned: ["in_transit", "failed"],
    in_transit: ["ready_for_pickup", "failed"],
    ready_for_pickup: ["failed"],
    failed: ["ready_for_pickup"],
  },
  carrier: {
    pending: ["in_transit", "cancelled"],
    in_transit: ["failed"],
    failed: ["in_transit"],
  },
};

export function canMove(method: string, from: string, to: string): boolean {
  return NEXT_STATUS[method]?.[from]?.includes(to) ?? false;
}

/*
  Une livraison peut-elle être confirmée par code ?

  Elle doit être en route — confirmer un colis encore `pending`
  signifierait qu'on l'a remis avant de l'avoir pris en charge.
*/
export function awaitsCode(delivery: { status: string; method: string }): boolean {
  if (delivery.method === "carrier") return false;

  return ["in_transit", "ready_for_pickup", "assigned"].includes(delivery.status);
}

export function customerId(req: unknown): string | null {
  const context = (req as { auth_context?: { actor_id?: string } }).auth_context;

  return context?.actor_id ?? null;
}
