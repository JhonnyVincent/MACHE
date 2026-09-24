/*
  ROUTE : le vendeur fait avancer un acheminement.

  Il peut le mettre en route, le marquer en échec, renseigner le suivi
  d'un transporteur extérieur, désigner l'agent qui vient chercher le
  colis. Il ne peut pas écrire « livré » : ce statut s'obtient en
  saisissant le code de l'acheteur, sur la route voisine.

  C'est la règle qui protège l'acheteur du seul abus réellement
  probable ici — un vendeur qui déclare livré ce qu'il n'a pas livré,
  et réclame son dû.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DELIVERY_MODULE } from "../../../../modules/delivery";
import {
  partyDelivery,
  canMove,
  text,
  MAX_NOTE,
  type DeliveryRow,
} from "../../../delivery-helpers";

type Service = {
  listDeliveries: (filters?: unknown, config?: unknown) => Promise<DeliveryRow[]>;
  updateDeliveries: (data: Record<string, unknown>) => Promise<unknown>;
};

export async function sellerDelivery(req: MedusaRequest): Promise<DeliveryRow | null> {
  const seller = (req as unknown as { seller_context?: { seller_id?: string } })
    .seller_context?.seller_id;

  const id = req.params.id;

  if (!seller || !id) return null;

  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  /*
    La boutique est dans le FILTRE, pas vérifiée après coup. Lire la
    ligne puis comparer laisserait, le jour où l'on oublie la
    comparaison, la livraison d'un concurrent sortir intacte.
  */
  const [delivery] = await service.listDeliveries(
    { id, seller_id: seller },
    { take: 1 }
  );

  return delivery ?? null;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const delivery = await sellerDelivery(req);

  if (!delivery) {
    return res.status(404).json({ message: "Livraison introuvable." });
  }

  return res.json({ delivery: partyDelivery(delivery) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const delivery = await sellerDelivery(req);

  if (!delivery) {
    return res.status(404).json({ message: "Livraison introuvable." });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  const patch: Record<string, unknown> = { id: delivery.id };

  /* Le suivi d'un transporteur extérieur, que MACHÉ affiche sans le piloter. */
  if (delivery.method === "carrier") {
    if (body.tracking_number !== undefined) {
      patch.tracking_number = text(body.tracking_number);
    }
    if (body.tracking_url !== undefined) {
      patch.tracking_url = text(body.tracking_url, 1000);
    }
    if (body.carrier_name !== undefined) {
      patch.carrier_name = text(body.carrier_name);
    }
  }

  /*
    Désigner l'agent qui prendra le colis. Possible tant que rien n'est
    parti : après, changer d'agent réécrirait qui détient réellement le
    colis, et le colis, lui, ne changerait pas de mains.
  */
  if (delivery.method === "agent" && body.agent_customer_id !== undefined) {
    if (delivery.status !== "pending") {
      return res.status(409).json({
        message: "Le colis est déjà en route : l'agent ne peut plus être changé ici.",
      });
    }
    patch.agent_customer_id = text(body.agent_customer_id);
  }

  if (body.status !== undefined) {
    const target = typeof body.status === "string" ? body.status : null;

    if (!target) {
      return res.status(400).json({ message: "Statut invalide." });
    }

    if (target === "delivered") {
      return res.status(409).json({
        message:
          "Une livraison se confirme avec le code que l'acheteur vous remet, pas en changeant son statut.",
      });
    }

    if (!canMove(delivery.method, delivery.status, target)) {
      return res.status(409).json({
        message: `Un acheminement « ${delivery.status} » ne peut pas passer à « ${target} ».`,
      });
    }

    patch.status = target;
    patch.failure_reason = target === "failed" ? text(body.reason, MAX_NOTE) : null;
  }

  if (Object.keys(patch).length === 1) {
    return res.status(400).json({ message: "Rien à modifier." });
  }

  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  const updated = (await service.updateDeliveries(patch)) as DeliveryRow;

  return res.json({ delivery: partyDelivery(updated) });
}
