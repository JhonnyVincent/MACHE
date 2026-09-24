/*
  ROUTE : une conversation, côté administration.

  GET rend TOUT, messages internes compris : c'est le poste de travail
  de celui qui répond, et lui cacher ses propres notes n'aurait aucun
  sens.

  POST fait trois choses, et une seule à la fois :

  - « reply » : répondre. Le message part au demandeur.
  - « note »  : écrire une note interne. Elle ne sort jamais.
  - « close » / « reopen » : fermer, rouvrir.

  Pourquoi une note interne est un MESSAGE et pas un champ

  Parce qu'elle a une date et un auteur, et qu'elle se lit dans le fil,
  à sa place. Rangée dans un champ unique, la deuxième note écraserait
  la première — et c'est précisément quand un dossier traîne qu'on en
  écrit plusieurs.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUPPORT_MODULE } from "../../../../../modules/support";
import {
  adminThread,
  text,
  MAX_BODY,
  type ThreadRow,
  type MessageRow,
} from "../../../../support-helpers";

type Service = {
  listThreads: (filters?: unknown, config?: unknown) => Promise<ThreadRow[]>;
  updateThreads: (data: Record<string, unknown>) => Promise<ThreadRow>;
  listThreadMessages: (filters?: unknown, config?: unknown) => Promise<MessageRow[]>;
  createThreadMessages: (data: Record<string, unknown>) => Promise<MessageRow>;
};

async function loadThread(req: MedusaRequest): Promise<ThreadRow | null> {
  const id = req.params.id;

  if (!id) return null;

  const service = req.scope.resolve(SUPPORT_MODULE) as Service;

  const [thread] = await service.listThreads({ id }, { take: 1 });

  return thread ?? null;
}

async function messagesOf(req: MedusaRequest, threadId: string) {
  const service = req.scope.resolve(SUPPORT_MODULE) as Service;

  return service.listThreadMessages(
    { thread_id: threadId },
    { order: { created_at: "ASC" }, take: 500 }
  );
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const thread = await loadThread(req);

  if (!thread) return res.status(404).json({ message: "Conversation introuvable." });

  const messages = await messagesOf(req, thread.id);

  return res.json({ thread: adminThread(thread, messages) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const thread = await loadThread(req);

  if (!thread) return res.status(404).json({ message: "Conversation introuvable." });

  const body = (req.body ?? {}) as Record<string, unknown>;

  const action = typeof body.action === "string" ? body.action : "";

  const service = req.scope.resolve(SUPPORT_MODULE) as Service;

  const authorName = text(body.author_name, 200) ?? "MACHÉ";

  /* ---------------------------------------------------------------- */
  if (action === "reply" || action === "note") {
    const message = text(body.message, MAX_BODY);

    if (!message) return res.status(400).json({ message: "Le message est vide." });

    const internal = action === "note";

    await service.createThreadMessages({
      thread_id: thread.id,
      author: "mache",
      author_name: internal ? authorName : "MACHÉ",
      body: message,
      internal,
    });

    /*
      Une note interne ne change pas l'état de la conversation. Elle ne
      part chez personne : marquer « répondu » après avoir écrit une
      note ferait croire, à la relecture, que le demandeur a eu une
      réponse.
    */
    const updated = internal
      ? thread
      : await service.updateThreads({
          id: thread.id,
          status: "answered",
          awaiting_mache: false,
          awaiting_sender: true,
          last_message_at: new Date(),
        });

    const messages = await messagesOf(req, thread.id);

    return res.json({ thread: adminThread(updated, messages) });
  }

  /* ---------------------------------------------------------------- */
  if (action === "close") {
    const updated = await service.updateThreads({
      id: thread.id,
      status: "closed",
      awaiting_mache: false,
      closed_at: new Date(),
    });

    return res.json({ thread: adminThread(updated) });
  }

  if (action === "reopen") {
    const updated = await service.updateThreads({
      id: thread.id,
      status: "open",
      awaiting_mache: true,
      closed_at: null,
    });

    return res.json({ thread: adminThread(updated) });
  }

  /* ---------------------------------------------------------------- */
  if (action === "category") {
    const value = typeof body.category === "string" ? body.category : null;

    if (!value) return res.status(400).json({ message: "Catégorie manquante." });

    const updated = await service.updateThreads({ id: thread.id, category: value });

    return res.json({ thread: adminThread(updated) });
  }

  return res.status(400).json({ message: "Action inconnue." });
}
