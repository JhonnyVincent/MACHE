/*
  Ce que les routes de devis partagent : lire une entrée, la nettoyer, et
  décider ce qu'un acheteur a le droit de voir.

  Rien ici ne fait confiance au corps de la requête. La route publique de
  création est ouverte — c'est sa raison d'être, un acheteur sans compte
  doit pouvoir demander un prix — donc tout ce qui en vient est traité
  comme du texte d'inconnu : longueur bornée, types vérifiés, quantité
  plafonnée.
*/

import crypto from "crypto";

/* Assez pour un message d'acheteur, pas au point de servir de dépôt. */
export const MAX_MESSAGE = 2000;
export const MAX_SHORT = 200;

/* Un devis porte sur une commande, pas sur un stock entier. */
export const MAX_QUANTITY = 1_000_000;

export type QuoteRow = {
  id: string;
  display_id: number;
  seller_id: string;
  customer_id: string | null;
  access_token: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_company: string | null;
  product_id: string | null;
  variant_id: string | null;
  product_title: string;
  quantity: number;
  message: string | null;
  status: string;
  seller_message: string | null;
  quoted_amount: number | string | null;
  currency_code: string | null;
  valid_until: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

export function text(value: unknown, max = MAX_SHORT): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  return trimmed.slice(0, max);
}

/*
  On ne valide pas l'adresse au caractère près : aucune expression
  régulière ne décide correctement de ce qui est une adresse, et une
  règle trop stricte refuse des adresses réelles. On vérifie la forme
  minimale, et le vendeur constatera le reste en répondant.
*/
export function email(value: unknown): string | null {
  const raw = text(value, 320);

  if (!raw) return null;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw.toLowerCase() : null;
}

export function quantity(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return null;

  const rounded = Math.floor(parsed);

  if (rounded < 1 || rounded > MAX_QUANTITY) return null;

  return rounded;
}

/*
  Le jeton de lecture. Il est tiré au hasard cryptographique : c'est la
  seule chose qui protège la demande d'un acheteur sans compte, et un
  identifiant devinable la rendrait publique.
*/
export function newAccessToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/*
  Comparaison à durée constante. Une comparaison ordinaire s'arrête au
  premier caractère différent, et le temps de réponse laisse alors
  reconstituer le jeton caractère par caractère.
*/
export function tokenMatches(expected: string, given: unknown): boolean {
  if (typeof given !== "string" || !expected) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(given);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

/*
  Ce qu'on renvoie à l'acheteur : jamais le jeton, jamais l'identifiant
  client d'un autre. Le montant reste `null` tant que le vendeur n'a pas
  répondu — zéro se lirait « gratuit ».
*/
export function publicQuote(quote: QuoteRow) {
  return {
    id: quote.id,
    display_id: quote.display_id,
    seller_id: quote.seller_id,
    status: quote.status,
    product_id: quote.product_id,
    variant_id: quote.variant_id,
    product_title: quote.product_title,
    quantity: quote.quantity,
    message: quote.message,
    buyer_name: quote.buyer_name,
    buyer_email: quote.buyer_email,
    buyer_phone: quote.buyer_phone,
    buyer_company: quote.buyer_company,
    seller_message: quote.seller_message,
    quoted_amount:
      quote.quoted_amount === null || quote.quoted_amount === undefined
        ? null
        : Number(quote.quoted_amount),
    currency_code: quote.currency_code,
    valid_until: quote.valid_until,
    created_at: quote.created_at,
    updated_at: quote.updated_at,
  };
}

/*
  Une réponse expirée n'est plus une offre.

  Le statut n'est pas réécrit en base par un travail de fond : personne
  ne garantit qu'il tourne, et un devis périmé affiché comme valable
  engagerait le vendeur sur un prix qu'il n'a plus. On calcule donc
  l'expiration à la lecture, à partir de la date que le vendeur a
  lui-même fixée.
*/
export function withExpiry<T extends { status: string; valid_until: unknown }>(
  quote: T,
  now = new Date()
): T {
  if (quote.status !== "answered" || !quote.valid_until) return quote;

  const until = new Date(quote.valid_until as string);

  if (Number.isNaN(until.getTime()) || until >= now) return quote;

  return { ...quote, status: "expired" };
}

/*
  L'identifiant du client connecté, quand il y en a un.

  Ces routes servent aussi les visiteurs sans compte : le type de requête
  authentifiée de Medusa ne convient donc pas, et le contexte
  d'authentification est lu tel qu'il est — présent ou absent.
*/
export function customerId(req: unknown): string | null {
  const context = (req as { auth_context?: { actor_id?: string } }).auth_context;

  return context?.actor_id ?? null;
}
