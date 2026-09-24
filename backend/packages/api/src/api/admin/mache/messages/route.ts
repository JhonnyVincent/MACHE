/*
  ROUTE : la pile de messages, côté administration.

  Elle est triée par ce qui attend MACHÉ, pas par date. Un écran de
  support qui range par date fait remonter ce qui vient d'arriver, et
  laisse dormir au fond la question posée il y a trois jours à laquelle
  personne n'a répondu.

  Le décompte accompagne la liste : il est calculé ici plutôt que dans
  l'écran, pour que deux endroits ne finissent pas par annoncer deux
  chiffres différents.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SUPPORT_MODULE } from "../../../../modules/support";
import { adminThread, type ThreadRow } from "../../../support-helpers";

type Service = {
  listAndCountThreads: (
    filters?: unknown,
    config?: unknown
  ) => Promise<[ThreadRow[], number]>;
  listThreads: (filters?: unknown, config?: unknown) => Promise<ThreadRow[]>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SUPPORT_MODULE) as Service;

  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const status = typeof req.query.status === "string" ? req.query.status : null;
  const category = typeof req.query.category === "string" ? req.query.category : null;

  const [threads, count] = await service.listAndCountThreads(
    { ...(status ? { status } : {}), ...(category ? { category } : {}) },
    {
      skip: offset,
      take: limit,
      /*
        Ce qui attend MACHÉ d'abord, puis le plus ancien en premier
        DANS ce groupe : on traite la file d'attente par son début, pas
        par sa fin.
      */
      order: { awaiting_mache: "DESC", last_message_at: "ASC" },
    }
  );

  const waiting = await service.listThreads(
    { awaiting_mache: true, status: ["open", "answered"] },
    { take: 500 }
  );

  return res.json({
    threads: threads.map((thread) => adminThread(thread)),
    count,
    waiting: waiting.length,
    offset,
    limit,
  });
}
