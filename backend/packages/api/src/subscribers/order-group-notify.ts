/*
  ABONNÉ : confirmer sa commande à l'ACHETEUR.

  Un seul e-mail par achat, même quand le panier mélangeait plusieurs
  boutiques : Mercur émet `order_group.created` une fois pour le groupe,
  qui réunit les commandes de chaque boutique. Un e-mail par boutique
  aurait laissé croire à plusieurs achats.
*/

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { notify } from "../lib/notify";
import { orderConfirmationEmail } from "../lib/notification-emails";
import { ORDER_FIELDS, customerName, isCashOnDelivery, summary, type RawOrder } from "../lib/order-notifications";

export default async function orderGroupNotify({ event, container }: SubscriberArgs<{ id?: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const id = event.data?.id;

  if (!id) return;

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data } = await query.graph({
      entity: "order_group",
      fields: [
        "id",
        ...ORDER_FIELDS.map((field) => `orders.${field}`),
        "cart.payment_collection.payment_sessions.provider_id",
      ],
      filters: { id },
    });

    const group = data?.[0] as {
      orders?: RawOrder[];
      cart?: { payment_collection?: { payment_sessions?: Array<{ provider_id?: string }> } };
    } | undefined;

    const orders = (group?.orders ?? []).filter(Boolean);

    if (orders.length === 0) return;

    const providers = group?.cart?.payment_collection?.payment_sessions?.map((s) => s.provider_id) ?? [];
    const first = orders[0];

    await notify(
      logger,
      "confirmation de commande (acheteur)",
      first.email,
      orderConfirmationEmail({
        customerName: customerName(first).split(" ")[0] ?? "",
        orders: orders.map(summary),
        cashOnDelivery: isCashOnDelivery(providers),
      })
    );
  } catch (error) {
    logger.error(`Confirmation de commande : e-mail impossible (${error instanceof Error ? error.message : String(error)}).`);
  }
}

export const config: SubscriberConfig = { event: "order_group.created" };
