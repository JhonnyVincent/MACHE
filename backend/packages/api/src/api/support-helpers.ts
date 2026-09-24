/*
  Ce que les routes de messagerie partagent.

  Ce fichier existe surtout pour UNE fonction : `publicThread`, qui
  décide de ce qui sort vers la personne qui a écrit.

  La règle qu'elle applique

  Les messages marqués internes ne sortent jamais. Ni la note interne
  de la conversation. Ce sont les endroits où l'on écrit « client
  déjà remboursé deux fois » ou « vérifier avec le vendeur avant de
  répondre » — des phrases exactes et utiles qui ne s'adressent pas au
  demandeur.

  Une projection séparée vaut mieux qu'un champ à ne pas oublier : on
  ne divulgue pas par distraction ce qu'on n'écrit nulle part.
*/

import crypto from "crypto";

export const MAX_SUBJECT = 200;
export const MAX_BODY = 5000;

/*
  Cinq conversations par heure et par adresse.

  Le formulaire est ouvert à tous — c'est sa raison d'être, quelqu'un
  sans compte doit pouvoir signaler un produit. Ouvert sans plafond, il
  devient une boîte à spam, et la pile de messages réels s'y noie.
*/
export const MAX_THREADS_PER_HOUR = 5;

/* Et vingt réponses par heure dans une même conversation. */
export const MAX_REPLIES_PER_HOUR = 20;

export type ThreadRow = {
  id: string;
  display_id: number;
  subject: string;
  category: string;
  from_name: string;
  from_email: string;
  from_phone: string | null;
  customer_id: string | null;
  seller_id: string | null;
  access_token: string;
  status: string;
  awaiting_mache: boolean;
  awaiting_sender: boolean;
  last_message_at: string | Date | null;
  internal_note: string | null;
  closed_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

export type MessageRow = {
  id: string;
  thread_id: string;
  author: string;
  author_name: string;
  body: string;
  internal: boolean;
  created_at: string | Date;
};

export function newAccessToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function tokenMatches(expected: string, given: unknown): boolean {
  if (typeof given !== "string" || !expected) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(given);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed ? trimmed.slice(0, max) : null;
}

/*
  On ne valide pas l'adresse au caractère près : aucune expression
  régulière ne décide correctement de ce qui est une adresse, et une
  règle trop stricte refuse des adresses réelles. On vérifie la forme
  minimale.
*/
export function email(value: unknown): string | null {
  const raw = text(value, 320);

  if (!raw) return null;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw.toLowerCase() : null;
}

export const CATEGORIES = [
  "question",
  "commande",
  "boutique",
  "signalement",
  "autre",
];

export function category(value: unknown): string {
  return typeof value === "string" && CATEGORIES.includes(value) ? value : "question";
}

/* Ce que voit la personne qui a écrit. Jamais le jeton, jamais l'interne. */
export function publicThread(thread: ThreadRow, messages: MessageRow[]) {
  return {
    id: thread.id,
    display_id: thread.display_id,
    subject: thread.subject,
    category: thread.category,
    from_name: thread.from_name,
    status: thread.status,
    awaiting_sender: thread.awaiting_sender,
    last_message_at: thread.last_message_at,
    created_at: thread.created_at,
    messages: messages
      .filter((message) => !message.internal)
      .map((message) => ({
        id: message.id,
        author: message.author,
        author_name: message.author_name,
        body: message.body,
        created_at: message.created_at,
      })),
  };
}

/* Ce que voit l'administration : tout, y compris l'interne. */
export function adminThread(thread: ThreadRow, messages?: MessageRow[]) {
  return {
    id: thread.id,
    display_id: thread.display_id,
    subject: thread.subject,
    category: thread.category,
    from_name: thread.from_name,
    from_email: thread.from_email,
    from_phone: thread.from_phone,
    customer_id: thread.customer_id,
    seller_id: thread.seller_id,
    status: thread.status,
    awaiting_mache: thread.awaiting_mache,
    awaiting_sender: thread.awaiting_sender,
    last_message_at: thread.last_message_at,
    internal_note: thread.internal_note,
    closed_at: thread.closed_at,
    created_at: thread.created_at,
    ...(messages
      ? {
          messages: messages.map((message) => ({
            id: message.id,
            author: message.author,
            author_name: message.author_name,
            body: message.body,
            internal: message.internal,
            created_at: message.created_at,
          })),
        }
      : {}),
  };
}

export function customerId(req: unknown): string | null {
  return (
    (req as { auth_context?: { actor_id?: string } }).auth_context?.actor_id ?? null
  );
}
