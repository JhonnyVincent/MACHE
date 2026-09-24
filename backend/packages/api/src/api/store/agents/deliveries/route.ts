/*
  ROUTE : les colis d'un agent.

  C'est l'écran qu'un agent ouvre sur son téléphone, une main occupée.

  Deux façons d'avoir un colis, et elles ne se recouvrent pas

  - il lui a été CONFIÉ : `agent_customer_id` porte son identifiant.
    C'est le cas du livreur ;
  - il est DÉPOSÉ dans un point de retrait qu'il tient. Le colis n'est
    alors attaché à personne, il est attaché au LIEU. C'est ce qui fait
    qu'un remplaçant retrouve les colis du point, et qu'un tenant qui
    change de point ne part pas avec eux.

  Les deux listes sont donc interrogées, puis fusionnées.

  Ce que la réponse ne contient jamais

  Le code de livraison. C'est la règle du module : celui qui livre ne
  le connaît pas, il l'obtient de l'acheteur au moment de la remise.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DELIVERY_MODULE } from "../../../../modules/delivery";
import { resolveAgent } from "../../../agent-context";
import { partyDelivery, customerId, type DeliveryRow } from "../../../delivery-helpers";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const OPEN = ["pending", "assigned", "in_transit", "ready_for_pickup"];

type Service = {
  listDeliveries: (filters?: unknown, config?: unknown) => Promise<DeliveryRow[]>;
  listRelayPoints: (filters?: unknown, config?: unknown) => Promise<{ id: string }[]>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const me = customerId(req);

  if (!me) {
    return res.status(401).json({ message: "Connectez-vous à votre compte." });
  }

  const agent = await resolveAgent(req.scope, me);

  if (!agent) {
    return res.status(403).json({
      message: "Ce compte n'a pas de fonction agent sur MACHÉ.",
    });
  }

  /*
    Un agent suspendu garde la vue sur ses colis — il doit pouvoir dire
    où ils sont — mais les routes qui font AVANCER une livraison le
    refusent. Lui couper la lecture ferait disparaître des colis réels
    au lieu de les rendre.
  */
  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  const scope = req.query.scope === "all" ? "all" : "open";

  const statusFilter = scope === "open" ? { status: OPEN } : {};

  const points = await service.listRelayPoints({ agent_customer_id: me });

  const pointIds = points.map((point) => point.id);

  const [assigned, atPoints] = await Promise.all([
    service.listDeliveries(
      { agent_customer_id: me, ...statusFilter },
      { take: limit, order: { created_at: "DESC" } }
    ),
    pointIds.length
      ? service.listDeliveries(
          { relay_point_id: pointIds, ...statusFilter },
          { take: limit, order: { created_at: "DESC" } }
        )
      : Promise.resolve([] as DeliveryRow[]),
  ]);

  /*
    Un colis confié à un agent QUI tient aussi le point où il est
    déposé remonterait deux fois. On déduplique par identifiant plutôt
    que d'exclure l'un des deux cas : l'exclusion ferait disparaître un
    colis réel dans une configuration parfaitement normale.
  */
  const byId = new Map<string, DeliveryRow>();

  for (const delivery of [...assigned, ...atPoints]) {
    byId.set(delivery.id, delivery);
  }

  const deliveries = [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return res.json({
    agent: {
      function: agent.function,
      zone: agent.zone,
      code: agent.code,
      suspended: agent.suspended,
    },
    relay_point_ids: pointIds,
    deliveries: deliveries.map(partyDelivery),
    count: deliveries.length,
  });
}
