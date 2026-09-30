/*
  ABONNÉ : prévenir le VENDEUR qu'une commande l'attend.

  Mercur émet `order.placed` pour chaque commande de boutique issue d'un
  panier. Sans cet e-mail, un vendeur ne savait pas qu'on lui avait
  commandé quelque chose tant qu'il n'ouvrait pas son panneau — et avec
  le paiement à la livraison, un client qui n'est pas rappelé est une
  vente perdue.

  L'e-mail part à l'adresse de la boutique (celle donnée à l'inscription).
*/

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { notify } from "../lib/notify";
import { orderForSellerEmail } from "../lib/notification-emails";
import {
  ORDER_FIELDS, addressText, customerName, isCashOnDelivery, summary, type RawOrder,
} from "../lib/order-notifications";

export default async function orderPlacedNotify({ event, container }: SubscriberArgs<{ id?: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const id = event.data?.id;

  if (!id) return;

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data } = await query.graph({
      entity: "order",
      fields: [...ORDER_FIELDS, "order_group.cart.payment_collection.payment_sessions.provider_id"],
      filters: { id },
    });

    const order = data?.[0] as (RawOrder & {
      order_group?: { cart?: { payment_collection?: { payment_sessions?: Array<{ provider_id?: string }> } } };
    }) | undefined;

    if (!order) return;

    const providers = order.order_group?.cart?.payment_collection?.payment_sessions?.map((s) => s.provider_id) ?? [];

    await notify(
      logger,
      "nouvelle commande (vendeur)",
      order.seller?.email,
      orderForSellerEmail({
        order: summary(order),
        customerName: customerName(order),
        phone: order.shipping_address?.phone ?? null,
        address: addressText(order.shipping_address ?? null),
        cashOnDelivery: isCashOnDelivery(providers),
      })
    );
  } catch (error) {
    logger.error(`Nouvelle commande : e-mail au vendeur impossible (${error instanceof Error ? error.message : String(error)}).`);
  }
}

export const config: SubscriberConfig = { event: "order.placed" };
