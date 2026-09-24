/*
  ROUTE : les livraisons de la boutique connectée.

  GET liste, POST ouvre un acheminement pour une commande.

  Le filtre par vendeur vient de `req.seller_context`, jamais de la
  requête : un vendeur qui écrirait `?seller_id=` d'un concurrent
  lirait sinon les adresses de ses clients.

  Ce que POST fait de décisif

  Il tire le code de remise. À partir de cet instant l'acheteur peut le
  lire sur sa page, et personne d'autre — la réponse renvoyée au
  vendeur ne le contient pas. C'est ce qui donne sa valeur à la
  confirmation : pour saisir ce code, il faudra l'avoir obtenu de
  l'acheteur.

  Le vendeur reçoit en revanche le jeton de lecture, une seule fois, à
  la création : c'est lui qui doit le transmettre à un acheteur sans
  compte, sans quoi cet acheteur n'aurait aucun moyen d'atteindre sa
  page de suivi.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DELIVERY_MODULE } from "../../../modules/delivery";
import {
  partyDelivery,
  newDeliveryCode,
  newAccessToken,
  text,
  MAX_SHORT,
  type DeliveryRow,
} from "../../delivery-helpers";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const METHODS = ["seller", "agent", "relay", "carrier"];

type Service = {
  listAndCountDeliveries: (
    filters?: unknown,
    config?: unknown
  ) => Promise<[DeliveryRow[], number]>;
  listDeliveries: (filters?: unknown, config?: unknown) => Promise<DeliveryRow[]>;
  listRelayPoints: (filters?: unknown, config?: unknown) => Promise<{ id: string; active: boolean }[]>;
  createDeliveries: (data: Record<string, unknown>) => Promise<DeliveryRow>;
};

function sellerId(req: MedusaRequest): string | null {
  return (
    (req as unknown as { seller_context?: { seller_id?: string } }).seller_context
      ?.seller_id ?? null
  );
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const seller = sellerId(req);

  if (!seller) {
    return res.status(401).json({ message: "Boutique non identifiée." });
  }

  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const status = typeof req.query.status === "string" ? req.query.status : null;

  const [deliveries, count] = await service.listAndCountDeliveries(
    { seller_id: seller, ...(status ? { status } : {}) },
    { skip: offset, take: limit, order: { created_at: "DESC" } }
  );

  return res.json({
    deliveries: deliveries.map(partyDelivery),
    count,
    offset,
    limit,
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const seller = sellerId(req);

  if (!seller) {
    return res.status(401).json({ message: "Boutique non identifiée." });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  const orderId = text(body.order_id);

  if (!orderId) {
    return res.status(400).json({ message: "Commande manquante." });
  }

  const method = typeof body.method === "string" ? body.method : null;

  if (!method || !METHODS.includes(method)) {
    return res.status(400).json({
      message:
        "Choisissez comment la commande est acheminée : par vous, par un agent MACHÉ, vers un point de retrait, ou par un transporteur.",
    });
  }

  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  /*
    Une commande, un acheminement. Sans ce contrôle, deux appels
    successifs créeraient deux codes valables pour le même colis, et
    l'acheteur ne saurait pas lequel lire.
  */
  const [existing] = await service.listDeliveries(
    { order_id: orderId, seller_id: seller },
    { take: 1 }
  );

  if (existing) {
    return res.status(409).json({
      message: "Cette commande a déjà un acheminement.",
      delivery: partyDelivery(existing),
    });
  }

  /*
    Un point de retrait doit exister et être ouvert. Accepter un
    identifiant quelconque enverrait un client à une adresse que
    personne ne tient.
  */
  let relayPointId: string | null = null;

  if (method === "relay") {
    relayPointId = text(body.relay_point_id);

    if (!relayPointId) {
      return res.status(400).json({ message: "Point de retrait manquant." });
    }

    const [point] = await service.listRelayPoints({ id: relayPointId }, { take: 1 });

    if (!point || !point.active) {
      return res.status(400).json({ message: "Ce point de retrait n'est pas ouvert." });
    }
  }

  if (method === "carrier" && !text(body.carrier_name)) {
    return res.status(400).json({ message: "Nom du transporteur manquant." });
  }

  const created = await service.createDeliveries({
    order_id: orderId,
    seller_id: seller,
    customer_id: text(body.customer_id),
    access_token: newAccessToken(),
    method,
    /*
      Le vendeur propose un agent ; l'agent n'est vraiment saisi que
      lorsqu'il prend le colis, ce qui fait passer la livraison à
      `assigned`. Le colis reste donc `pending` ici, quelle que soit la
      méthode : rien n'a encore quitté la boutique.
    */
    agent_customer_id: method === "agent" ? text(body.agent_customer_id) : null,
    relay_point_id: relayPointId,
    carrier_name: method === "carrier" ? text(body.carrier_name) : null,
    tracking_number: method === "carrier" ? text(body.tracking_number) : null,
    tracking_url: method === "carrier" ? text(body.tracking_url, 1000) : null,
    recipient_name: text(body.recipient_name),
    recipient_phone: text(body.recipient_phone),
    recipient_address: text(body.recipient_address, 1000),
    recipient_department: text(body.recipient_department, MAX_SHORT),
    code: newDeliveryCode(),
    status: "pending",
  });

  return res.status(201).json({
    delivery: partyDelivery(created),
    /*
      Le jeton n'est donné qu'ici. Le renvoyer à chaque lecture le
      ferait traîner dans les journaux et les caches du vendeur, alors
      qu'il n'a qu'un usage : être transmis une fois à l'acheteur.
    */
    access_token: created.access_token,
  });
}
