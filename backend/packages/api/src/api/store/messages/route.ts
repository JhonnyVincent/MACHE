/*
  ROUTE PUBLIQUE : écrire à MACHÉ.

  Ouverte à tous, et c'est sa raison d'être : quelqu'un qui signale un
  produit inadmissible n'a pas forcément de compte, et lui demander
  d'en créer un reviendrait à ne pas recevoir le signalement.

  Ce qui protège cette ouverture

  Un plafond par adresse et par heure. Sans lui, le formulaire devient
  une boîte à spam et les messages réels s'y noient — ce qui revient à
  fermer la porte tout en la laissant ouverte.

  GET : les conversations du client connecté. C'est la seule façon, pour
  quelqu'un qui a un compte, de retrouver ses échanges sans conserver de
  lien.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUPPORT_MODULE } from "../../../modules/support";
import {
  publicThread,
  newAccessToken,
  text,
  email,
  category,
  customerId,
  MAX_SUBJECT,
  MAX_BODY,
  MAX_THREADS_PER_HOUR,
  type ThreadRow,
  type MessageRow,
} from "../../support-helpers";

type Service = {
  listThreads: (filters?: unknown, config?: unknown) => Promise<ThreadRow[]>;
  createThreads: (data: Record<string, unknown>) => Promise<ThreadRow>;
  createThreadMessages: (data: Record<string, unknown>) => Promise<MessageRow>;
  listThreadMessages: (filters?: unknown, config?: unknown) => Promise<MessageRow[]>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const me = customerId(req);

  if (!me) {
    return res.status(401).json({ message: "Connectez-vous à votre compte." });
  }

  const service = req.scope.resolve(SUPPORT_MODULE) as Service;

  const threads = await service.listThreads(
    { customer_id: me },
    { order: { last_message_at: "DESC" }, take: 100 }
  );

  /*
    La liste ne porte pas les messages : elle sert à choisir une
    conversation, pas à la lire. Les charger toutes ferait transiter
    l'intégralité des échanges d'une personne pour afficher des titres.
  */
  return res.json({
    threads: threads.map((thread) => publicThread(thread, [])),
    count: threads.length,
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const fromName = text(body.from_name, 200);
  const fromEmail = email(body.from_email);
  const subject = text(body.subject, MAX_SUBJECT);
  const message = text(body.message, MAX_BODY);

  if (!fromName) return res.status(400).json({ message: "Indiquez votre nom." });

  if (!fromEmail) {
    return res.status(400).json({
      message: "Indiquez une adresse e-mail valide, pour qu'on sache qui vous êtes.",
    });
  }

  if (!subject) return res.status(400).json({ message: "Donnez un objet à votre message." });

  if (!message || message.length < 10) {
    return res.status(400).json({ message: "Écrivez votre message." });
  }

  const service = req.scope.resolve(SUPPORT_MODULE) as Service;

  /*
    Le plafond. Il porte sur l'adresse, pas sur la session : quelqu'un
    qui inonde le formulaire ne se connecte pas.
  */
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recent = await service.listThreads(
    { from_email: fromEmail, created_at: { $gte: hourAgo } },
    { take: MAX_THREADS_PER_HOUR + 1 }
  );

  if (recent.length >= MAX_THREADS_PER_HOUR) {
    return res.status(429).json({
      message:
        "Vous avez déjà ouvert plusieurs conversations dans l'heure. Répondez dans l'une d'elles plutôt que d'en ouvrir une nouvelle.",
    });
  }

  const now = new Date();

  const thread = await service.createThreads({
    subject,
    category: category(body.category),
    from_name: fromName,
    from_email: fromEmail,
    from_phone: text(body.from_phone, 60),
    customer_id: customerId(req),
    seller_id: text(body.seller_id, 100),
    access_token: newAccessToken(),
    status: "open",
    awaiting_mache: true,
    awaiting_sender: false,
    last_message_at: now,
  });

  await service.createThreadMessages({
    thread_id: thread.id,
    author: "sender",
    author_name: fromName,
    body: message,
    internal: false,
  });

  const messages = await service.listThreadMessages({ thread_id: thread.id });

  return res.status(201).json({
    thread: publicThread(thread, messages),
    /*
      Le jeton n'est donné qu'ICI, une seule fois. Pour quelqu'un sans
      compte, c'est la seule clé de sa conversation : MACHÉ n'a pas
      d'e-mail pour la lui renvoyer. L'écran le dit au moment de
      l'envoi, pas après.
    */
    access_token: thread.access_token,
  });
}
