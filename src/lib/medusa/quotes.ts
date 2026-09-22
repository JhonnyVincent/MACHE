/*
  Les devis, côté site.

  Pourquoi ils existent

  Le catalogue vend au prix affiché. Une part du commerce haïtien ne se
  fait pas ainsi : on demande un prix pour une quantité, on discute le
  délai et la livraison, et la vente commence après. Cette demande
  partait jusqu'ici sur WhatsApp, où elle n'est ni conservée, ni
  rattachée à une boutique, ni retrouvable — ni par l'acheteur, ni par le
  vendeur.

  Ce qu'un devis n'est pas

  Ce n'est pas une commande. Rien n'est réservé, rien n'est encaissé, et
  accepter une proposition ne fait pas plus que dire au vendeur qu'on la
  veut. Les pages emploient ces mots-là : laisser croire à un achat
  conclu serait une promesse que rien ne soutient.

  Le jeton de lecture

  Un acheteur sans compte reçoit un jeton à la création. Sans lui, il
  faudrait s'inscrire pour lire la réponse à une question de trente
  secondes, et la plupart des demandes seraient perdues.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";
import {
  backendTimeoutSignal,
  isTimeout,
  TIMEOUT_MESSAGE,
} from "./timeout";

const CUSTOMER_TOKEN_COOKIE = "mache_customer_token";

export type QuoteStatus =
  | "pending"
  | "answered"
  | "accepted"
  | "declined"
  | "expired";

export type Quote = {
  id: string;
  displayId: number;
  sellerId: string;
  status: QuoteStatus;
  productId: string | null;
  variantId: string | null;
  productTitle: string;
  quantity: number;
  message: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  buyerCompany: string | null;
  sellerMessage: string | null;
  quotedAmount: number | null;
  currencyCode: string | null;
  validUntil: string | null;
  createdAt: string;
};

type Raw = Record<string, unknown>;
type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const STATUSES: QuoteStatus[] = [
  "pending",
  "answered",
  "accepted",
  "declined",
  "expired",
];

function status(value: unknown): QuoteStatus {
  const raw = str(value);

  return raw && (STATUSES as string[]).includes(raw)
    ? (raw as QuoteStatus)
    : "pending";
}

function parseQuote(raw: Raw): Quote {
  const amount = raw.quoted_amount;

  return {
    id: String(raw.id ?? ""),
    displayId: Number(raw.display_id) || 0,
    sellerId: String(raw.seller_id ?? ""),
    status: status(raw.status),
    productId: str(raw.product_id),
    variantId: str(raw.variant_id),
    productTitle: str(raw.product_title) ?? "Article",
    quantity: Number(raw.quantity) || 0,
    message: str(raw.message),
    buyerName: str(raw.buyer_name) ?? "",
    buyerEmail: str(raw.buyer_email) ?? "",
    buyerPhone: str(raw.buyer_phone),
    buyerCompany: str(raw.buyer_company),
    sellerMessage: str(raw.seller_message),
    /*
      `null` tant que le vendeur n'a pas chiffré. Zéro se lirait
      « gratuit », et c'est précisément ce que personne n'a dit.
    */
    quotedAmount:
      amount === null || amount === undefined || amount === ""
        ? null
        : Number(amount),
    currencyCode: str(raw.currency_code),
    validUntil: str(raw.valid_until),
    createdAt: str(raw.created_at) ?? "",
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
    Le jeton du client connecté, quand il y en a un. C'est lui qui
    rattache la demande à son compte : sans ça, un acheteur identifié
    retrouverait ses devis uniquement par le lien reçu.
  */
  const store = await cookies();
  const token = store.get(CUSTOMER_TOKEN_COOKIE)?.value;

  if (token) headers.authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${configured.config.url}${path}`, {
      /* Une attente qui ne finit jamais fige l\'écran sans rien dire. */
      signal: backendTimeoutSignal(),
      method: init.method ?? "GET",
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
      /* Un devis est propre à une personne : jamais de cache. */
      cache: "no-store",
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
    /*
      Un abandon n\'est pas une panne réseau : il vaut la peine
      d\'être réessayé, et le dire évite de renoncer.
    */
    if (isTimeout(error)) {
      return { ok: false, reason: TIMEOUT_MESSAGE };
    }

    const message = error instanceof Error ? error.message : String(error);

    return { ok: false, reason: `Backend injoignable : ${message}` };
  }
}

export type QuoteRequest = {
  sellerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
  buyerCompany?: string | null;
  productId?: string | null;
  variantId?: string | null;
  productTitle: string;
  quantity: number;
  message?: string | null;
};

export async function requestQuote(
  input: QuoteRequest
): Promise<Result<{ quote: Quote; accessToken: string }>> {
  const result = await request<Raw>("/store/quotes", {
    method: "POST",
    body: {
      seller_id: input.sellerId,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      buyer_phone: input.buyerPhone ?? null,
      buyer_company: input.buyerCompany ?? null,
      product_id: input.productId ?? null,
      variant_id: input.variantId ?? null,
      product_title: input.productTitle,
      quantity: input.quantity,
      message: input.message ?? null,
    },
  });

  if (!result.ok) return result;

  const quote = result.data.quote as Raw | undefined;

  if (!quote?.id) {
    return { ok: false, reason: "Réponse inattendue du backend." };
  }

  return {
    ok: true,
    data: {
      quote: parseQuote(quote),
      accessToken: String(result.data.access_token ?? ""),
    },
  };
}

export async function fetchQuote(
  id: string,
  accessToken?: string | null
): Promise<Result<Quote>> {
  const suffix = accessToken
    ? `?token=${encodeURIComponent(accessToken)}`
    : "";

  const result = await request<Raw>(`/store/quotes/${encodeURIComponent(id)}${suffix}`);

  if (!result.ok) return result;

  const quote = result.data.quote as Raw | undefined;

  if (!quote?.id) return { ok: false, reason: "Demande introuvable." };

  return { ok: true, data: parseQuote(quote) };
}

export async function answerQuote(
  id: string,
  action: "accept" | "decline",
  accessToken?: string | null
): Promise<Result<Quote>> {
  const result = await request<Raw>(`/store/quotes/${encodeURIComponent(id)}`, {
    method: "POST",
    body: { action, token: accessToken ?? undefined },
  });

  if (!result.ok) return result;

  const quote = result.data.quote as Raw | undefined;

  if (!quote?.id) return { ok: false, reason: "Réponse inattendue du backend." };

  return { ok: true, data: parseQuote(quote) };
}

/*
  Les demandes du client connecté. Renvoie une liste vide plutôt qu'une
  erreur quand personne n'est connecté : l'espace client appelle cette
  fonction avant de savoir s'il a affaire à un visiteur.
*/
export async function fetchMyQuotes(): Promise<Result<Quote[]>> {
  const result = await request<Raw>("/store/quotes");

  if (!result.ok) return result;

  const quotes = Array.isArray(result.data.quotes)
    ? (result.data.quotes as Raw[])
    : [];

  return { ok: true, data: quotes.map(parseQuote) };
}

/*
  Ce que chaque statut veut dire, en français, pour l'acheteur. Les
  libellés disent ce qui s'est passé, pas ce qu'on espère : « Le vendeur
  n'a pas encore répondu » plutôt que « En cours de traitement ».
*/
export const QUOTE_LABELS: Record<QuoteStatus, string> = {
  pending: "Le vendeur n’a pas encore répondu",
  answered: "Proposition reçue",
  accepted: "Vous avez accepté cette proposition",
  declined: "Proposition refusée",
  expired: "La proposition a expiré",
};
