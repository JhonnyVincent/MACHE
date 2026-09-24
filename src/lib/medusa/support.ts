/*
  La messagerie, côté storefront.

  Pourquoi elle existe

  La page contact affichait quatre adresses en @mache.local — un
  domaine qui n'existe pas. Personne ne recevait rien. MACHÉ n'a pas de
  fournisseur d'e-mail et n'en aura pas demain, donc la conversation vit
  dans le site.

  CE QUE CE FICHIER NE PEUT PAS FAIRE, ET QU'IL FAUT DIRE AUX ÉCRANS

  Prévenir qui que ce soit. Sans e-mail, personne n'est averti qu'une
  réponse est arrivée. Un client connecté la retrouvera dans son espace ;
  quelqu'un sans compte n'a que le lien privé rendu à l'envoi.

  `accessToken` n'est donc pas un détail technique : c'est la seule clé
  de sa propre conversation pour un visiteur sans compte. Il n'est rendu
  qu'une fois, à la création, et l'écran doit le lui donner.
*/

import { cookies } from "next/headers";
import { getMedusaConfig } from "./config";
import { backendTimeoutSignal, isTimeout, TIMEOUT_MESSAGE } from "./timeout";

const CUSTOMER_COOKIE = "mache_customer_token";

type Raw = Record<string, unknown>;

export type Result<T> = { ok: true; data: T } | { ok: false; reason: string };

export type ThreadMessage = {
  id: string;
  author: "sender" | "mache";
  authorName: string;
  body: string;
  createdAt: string | null;
};

export type Thread = {
  id: string;
  displayId: number;
  subject: string;
  category: string;
  fromName: string;
  status: "open" | "answered" | "closed";
  awaitingSender: boolean;
  lastMessageAt: string | null;
  createdAt: string | null;
  messages: ThreadMessage[];
};

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/*
  La session client est jointe QUAND elle existe, et c'est tout
  l'arrangement : le même appel sert au visiteur anonyme et au client
  connecté. Pour le second, la conversation est rattachée à son compte
  et il la retrouvera sans conserver de lien.
*/
async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<Result<T>> {
  const configured = getMedusaConfig();

  if (!configured.ok) return { ok: false, reason: configured.reason };

  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value ?? null;

  const headers: Record<string, string> = {
    "x-publishable-api-key": configured.config.key,
    "content-type": "application/json",
    accept: "application/json",
  };

  if (token) headers.authorization = `Bearer ${token}`;

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

function mapThread(raw: Raw): Thread {
  const messages = Array.isArray(raw.messages) ? (raw.messages as Raw[]) : [];

  return {
    id: String(raw.id ?? ""),
    displayId: Number(raw.display_id) || 0,
    subject: str(raw.subject) ?? "",
    category: str(raw.category) ?? "question",
    fromName: str(raw.from_name) ?? "",
    status: (str(raw.status) ?? "open") as Thread["status"],
    awaitingSender: raw.awaiting_sender === true,
    lastMessageAt: str(raw.last_message_at),
    createdAt: str(raw.created_at),
    messages: messages.map((message) => ({
      id: String(message.id ?? ""),
      author: (str(message.author) ?? "sender") as ThreadMessage["author"],
      authorName: str(message.author_name) ?? "",
      body: typeof message.body === "string" ? message.body : "",
      createdAt: str(message.created_at),
    })),
  };
}

export async function openThread(input: {
  fromName: string;
  fromEmail: string;
  fromPhone?: string;
  subject: string;
  category: string;
  message: string;
}): Promise<Result<{ thread: Thread; accessToken: string }>> {
  const result = await request<{ thread?: Raw; access_token?: string }>(
    "/store/messages",
    {
      method: "POST",
      body: {
        from_name: input.fromName,
        from_email: input.fromEmail,
        from_phone: input.fromPhone,
        subject: input.subject,
        category: input.category,
        message: input.message,
      },
    }
  );

  if (!result.ok) return result;

  if (!result.data.thread) {
    return { ok: false, reason: "Le message n'a pas été enregistré." };
  }

  return {
    ok: true,
    data: {
      thread: mapThread(result.data.thread),
      /*
        Rendu une seule fois. Pour un visiteur sans compte, c'est la
        seule clé de sa conversation : MACHÉ n'a pas d'e-mail pour la
        lui renvoyer.
      */
      accessToken: str(result.data.access_token) ?? "",
    },
  };
}

export async function getThread(
  id: string,
  token?: string
): Promise<Result<Thread>> {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";

  const result = await request<{ thread?: Raw }>(
    `/store/messages/${encodeURIComponent(id)}${query}`
  );

  if (!result.ok) return result;

  if (!result.data.thread) return { ok: false, reason: "Conversation introuvable." };

  return { ok: true, data: mapThread(result.data.thread) };
}

export async function replyToThread(
  id: string,
  message: string,
  token?: string
): Promise<Result<Thread>> {
  const result = await request<{ thread?: Raw }>(
    `/store/messages/${encodeURIComponent(id)}`,
    { method: "POST", body: { message, token } }
  );

  if (!result.ok) return result;

  return { ok: true, data: mapThread(result.data.thread ?? {}) };
}

export async function getMyThreads(): Promise<Result<Thread[]>> {
  const result = await request<{ threads?: Raw[] }>("/store/messages");

  if (!result.ok) return result;

  return { ok: true, data: (result.data.threads ?? []).map(mapThread) };
}

export const THREAD_CATEGORIES: { value: string; label: string; hint: string }[] = [
  {
    value: "question",
    label: "Une question",
    hint: "Sur le site, les tarifs, le fonctionnement.",
  },
  {
    value: "commande",
    label: "Une commande",
    hint: "Un achat en cours, une livraison, un remboursement.",
  },
  {
    value: "boutique",
    label: "Ma boutique",
    hint: "Ouvrir une boutique, un problème de vendeur.",
  },
  {
    value: "signalement",
    label: "Un signalement",
    hint: "Un produit, un avis ou un comportement à signaler.",
  },
  { value: "autre", label: "Autre chose", hint: "" },
];

export const THREAD_STATUS_LABELS: Record<string, string> = {
  open: "En attente de MACHÉ",
  answered: "Réponse de MACHÉ",
  closed: "Close",
};
