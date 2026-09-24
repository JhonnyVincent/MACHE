/*
  ROUTE : lire une conversation, et y répondre.

  Qui a le droit

  Le client connecté propriétaire, ou le porteur du jeton donné à
  l'envoi. Un identifiant inconnu et un jeton faux reçoivent la MÊME
  réponse, 404 — les distinguer dirait à qui essaie des identifiants
  lesquels existent.

  Ce qui ne sort jamais

  Les messages internes et la note interne. Ce sont les endroits où
  l'on écrit « vérifier avec le vendeur avant de répondre » : des
  phrases utiles qui ne s'adressent pas au demandeur. Le filtrage est
  dans la projection, pas dans un champ à ne pas oublier.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUPPORT_MODULE } from "../../../../modules/support";
import {
  publicThread,
  tokenMatches,
  text,
  customerId,
  MAX_BODY,
  MAX_REPLIES_PER_HOUR,
  type ThreadRow,
  type MessageRow,
} from "../../../support-helpers";

type Service = {
  listThreads: (filters?: unknown, config?: unknown) => Promise<ThreadRow[]>;
  updateThreads: (data: Record<string, unknown>) => Promise<ThreadRow>;
  listThreadMessages: (filters?: unknown, config?: unknown) => Promise<MessageRow[]>;
  createThreadMessages: (data: Record<string, unknown>) => Promise<MessageRow>;
};

async function allowed(req: MedusaRequest): Promise<ThreadRow | null> {
  const id = req.params.id;

  if (!id) return null;

  const service = req.scope.resolve(SUPPORT_MODULE) as Service;

  const [thread] = await service.listThreads({ id }, { take: 1 });

  if (!thread) return null;

  const me = customerId(req);

  if (me && thread.customer_id === me) return thread;

  const token =
    (req.query.token as unknown) ??
    (req.body as { token?: unknown } | undefined)?.token;

  if (tokenMatches(thread.access_token, token)) return thread;

  return null;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const thread = await allowed(req);

  if (!thread) return res.status(404).json({ message: "Conversation introuvable." });

  const service = req.scope.resolve(SUPPORT_MODULE) as Service;

  const messages = await service.listThreadMessages(
    { thread_id: thread.id },
    { order: { created_at: "ASC" }, take: 500 }
  );

  /*
    La lecture éteint le drapeau « en attente du demandeur ». C'est ce
    qui permet à l'administration de distinguer « il n'a pas encore vu
    notre réponse » de « il l'a lue et n'a pas répondu » — deux
    situations qui n'appellent pas la même relance.
  */
  let current = thread;

  if (thread.awaiting_sender) {
    current = await service.updateThreads({
      id: thread.id,
      awaiting_sender: false,
    });
  }

  return res.json({ thread: publicThread(current, messages) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const thread = await allowed(req);

  if (!thread) return res.status(404).json({ message: "Conversation introuvable." });

  if (thread.status === "closed") {
    return res.status(409).json({
      message:
        "Cette conversation est close. Ouvrez-en une nouvelle si vous avez autre chose à nous dire.",
    });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  const message = text(body.message, MAX_BODY);

  if (!message || message.length < 2) {
    return res.status(400).json({ message: "Écrivez votre message." });
  }

  const service = req.scope.resolve(SUPPORT_MODULE) as Service;

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recent = await service.listThreadMessages(
    { thread_id: thread.id, author: "sender", created_at: { $gte: hourAgo } },
    { take: MAX_REPLIES_PER_HOUR + 1 }
  );

  if (recent.length >= MAX_REPLIES_PER_HOUR) {
    return res.status(429).json({
      message: "Trop de messages d'affilée. Laissez-nous le temps de vous répondre.",
    });
  }

  const now = new Date();

  await service.createThreadMessages({
    thread_id: thread.id,
    author: "sender",
    author_name: thread.from_name,
    body: message,
    internal: false,
  });

  const updated = await service.updateThreads({
    id: thread.id,
    /*
      Répondre rouvre la conversation. Une réponse à un échange marqué
      « répondu » doit remonter la pile de MACHÉ, sinon elle attend là
      où personne ne regarde plus.
    */
    status: "open",
    awaiting_mache: true,
    awaiting_sender: false,
    last_message_at: now,
  });

  const messages = await service.listThreadMessages(
    { thread_id: thread.id },
    { order: { created_at: "ASC" }, take: 500 }
  );

  return res.json({ thread: publicThread(updated, messages) });
}
