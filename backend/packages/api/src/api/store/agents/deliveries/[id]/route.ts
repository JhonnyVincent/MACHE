/*
  ROUTE : l'agent fait avancer un colis.

  Prise en charge, mise en route, arrivée au point de retrait, échec.
  Jamais « livré » : on n'atteint pas ce statut en le déclarant, mais
  en saisissant le code de l'acheteur, sur la route voisine.

  C'est la distinction qui tient tout le module. Si un agent pouvait
  écrire `status: "delivered"`, le code ne servirait plus à rien et la
  preuve de remise serait redevenue une déclaration.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DELIVERY_MODULE } from "../../../../../modules/delivery";
import { resolveAgent } from "../../../../agent-context";
import {
  partyDelivery,
  customerId,
  canMove,
  text,
  MAX_NOTE,
  type DeliveryRow,
} from "../../../../delivery-helpers";

type Service = {
  listDeliveries: (filters?: unknown, config?: unknown) => Promise<DeliveryRow[]>;
  listRelayPoints: (filters?: unknown, config?: unknown) => Promise<{ id: string }[]>;
  updateDeliveries: (data: Record<string, unknown>) => Promise<unknown>;
};

/*
  Le colis est-il vraiment à cet agent ? Confié à lui, ou déposé dans
  un point qu'il tient. Sans ce contrôle, un agent pourrait faire
  avancer — et donc marquer en échec — les colis d'un autre.
*/
export async function agentDelivery(
  req: MedusaRequest,
  me: string
): Promise<DeliveryRow | null> {
  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  const id = req.params.id;

  if (!id) return null;

  const [delivery] = await service.listDeliveries({ id }, { take: 1 });

  if (!delivery) return null;

  if (delivery.agent_customer_id === me) return delivery;

  if (delivery.relay_point_id) {
    const points = await service.listRelayPoints({ agent_customer_id: me });

    if (points.some((point) => point.id === delivery.relay_point_id)) {
      return delivery;
    }
  }

  return null;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const me = customerId(req);

  if (!me) {
    return res.status(401).json({ message: "Connectez-vous à votre compte." });
  }

  const agent = await resolveAgent(req.scope, me);

  if (!agent) {
    return res.status(403).json({ message: "Ce compte n'a pas de fonction agent." });
  }

  if (agent.suspended) {
    return res.status(403).json({
      message: "Votre habilitation d'agent est suspendue. Contactez MACHÉ.",
    });
  }

  const delivery = await agentDelivery(req, me);

  if (!delivery) {
    return res.status(404).json({ message: "Colis introuvable." });
  }

  const body = (req.body ?? {}) as { status?: unknown; reason?: unknown };

  const target = typeof body.status === "string" ? body.status : null;

  if (!target) {
    return res.status(400).json({ message: "Statut manquant." });
  }

  if (target === "delivered") {
    return res.status(409).json({
      message:
        "Une livraison se confirme avec le code que l'acheteur vous remet, pas en changeant son statut.",
    });
  }

  if (!canMove(delivery.method, delivery.status, target)) {
    return res.status(409).json({
      message: `Un colis « ${delivery.status} » ne peut pas passer à « ${target} ».`,
    });
  }

  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  const updated = (await service.updateDeliveries({
    id: delivery.id,
    status: target,
    /*
      La raison n'est gardée que pour un échec, et elle est effacée
      quand on repart : un colis remis en route qui afficherait encore
      « destinataire absent » ferait croire à un second échec.
    */
    failure_reason: target === "failed" ? text(body.reason, MAX_NOTE) : null,
  })) as DeliveryRow;

  return res.json({ delivery: partyDelivery(updated) });
}
