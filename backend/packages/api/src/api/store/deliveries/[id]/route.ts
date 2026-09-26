/*
  ROUTE : la page de suivi de l'acheteur.

  C'est le seul endroit du site où le code de livraison s'affiche. Tout
  le reste du module s'organise autour de ce fait : celui qui livre ne
  le voit jamais, donc pour le saisir il doit l'avoir obtenu de
  l'acheteur, donc l'avoir rencontré.

  Qui a le droit de lire

  Le client connecté propriétaire de la livraison, ou le porteur du
  jeton envoyé avec la commande. Le jeton existe parce qu'on peut
  acheter sans compte : sans lui, un acheteur sans compte n'aurait
  aucun moyen de lire son propre code.

  Un identifiant inconnu et un jeton faux reçoivent la MÊME réponse,
  404. Les distinguer dirait à qui essaie des identifiants lesquels
  existent, et il ne resterait plus qu'à chercher le jeton.

  POST : l'acheteur constate la réception

  Réservé aux commandes confiées à un transporteur extérieur. Pour
  celles-là, et seulement celles-là, aucun code MACHÉ ne peut être
  saisi à la remise : le livreur du transporteur ne connaît pas MACHÉ.
  Le constat de l'acheteur est alors la seule information disponible.
  Elle est enregistrée comme telle — `confirmed_by: "customer"` — pour
  qu'un litige sache qu'elle est déclarative et non prouvée.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DELIVERY_MODULE } from "../../../../modules/delivery";
import { payoutStateAfterConfirmation } from "../../../payout-freeze";
import {
  buyerDelivery,
  tokenMatches,
  customerId,
  text,
  MAX_NOTE,
  type DeliveryRow,
} from "../../../delivery-helpers";

type Service = {
  listDeliveries: (filters?: unknown, config?: unknown) => Promise<DeliveryRow[]>;
  updateDeliveries: (data: Record<string, unknown>) => Promise<unknown>;
};

async function readAllowed(
  req: MedusaRequest
): Promise<DeliveryRow | null> {
  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  const id = req.params.id;

  if (!id) return null;

  const [delivery] = await service.listDeliveries({ id }, { take: 1 });

  if (!delivery) return null;

  const viewer = customerId(req);

  if (viewer && delivery.customer_id === viewer) return delivery;

  const token =
    (req.query.token as unknown) ??
    (req.body as { token?: unknown } | undefined)?.token;

  if (tokenMatches(delivery.access_token, token)) return delivery;

  return null;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const delivery = await readAllowed(req);

  if (!delivery) {
    return res.status(404).json({ message: "Livraison introuvable." });
  }

  return res.json({ delivery: buyerDelivery(delivery) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const delivery = await readAllowed(req);

  if (!delivery) {
    return res.status(404).json({ message: "Livraison introuvable." });
  }

  if (delivery.method !== "carrier") {
    return res.status(409).json({
      message:
        "Cette livraison se confirme par le code que vous remettez à la personne qui livre.",
    });
  }

  if (delivery.status === "delivered") {
    return res.status(409).json({ message: "Réception déjà constatée." });
  }

  if (delivery.status === "cancelled") {
    return res.status(409).json({ message: "Cette livraison est annulée." });
  }

  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  const updated = (await service.updateDeliveries({
    id: delivery.id,
    status: "delivered",
    confirmed_by: "customer",
    confirmed_at: new Date(),
    confirmation_note: text((req.body as { note?: unknown })?.note, MAX_NOTE),
    /*
      Même règle que pour une confirmation par code : si la boutique
      est gelée, la réception reste constatée mais la somme reste
      retenue. Un transporteur extérieur n'est pas une raison de
      relâcher l'argent d'une boutique sous enquête.
    */
    payout_state: await payoutStateAfterConfirmation(req.scope, delivery.seller_id),
  })) as DeliveryRow;

  return res.json({ delivery: buyerDelivery(updated) });
}
