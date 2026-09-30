/*
  ABONNÉ : la vie d'une boutique.

  - `seller.created`  : une boutique vient de s'inscrire. L'équipe MACHE
    est prévenue : tant qu'elle n'approuve pas, la boutique attend.
  - `seller.approved` : MACHE l'a approuvée. Le vendeur est prévenu que
    sa boutique est visible.

  Les alertes de l'équipe partent à ADMIN_ALERT_EMAIL, ou à défaut à
  l'adresse d'expédition de MACHE (MAIL_FROM).
*/

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { notify } from "../lib/notify";
import { adminAlertAddress, adminAlertEmail, sellerApprovedEmail } from "../lib/notification-emails";

type Seller = { id: string; name?: string | null; email?: string | null; handle?: string | null };

export default async function sellerNotify({ event, container }: SubscriberArgs<{ id?: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const id = event.data?.id;

  if (!id) return;

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data } = await query.graph({
      entity: "seller",
      fields: ["id", "name", "email", "handle"],
      filters: { id },
    });

    const seller = data?.[0] as Seller | undefined;

    if (!seller) return;

    const name = String(seller.name || "Votre boutique");

    if (event.name === "seller.approved") {
      await notify(logger, "boutique approuvée (vendeur)", seller.email, sellerApprovedEmail({ sellerName: name, handle: seller.handle ?? null }));
      return;
    }

    await notify(
      logger,
      "nouvelle boutique (équipe)",
      adminAlertAddress(),
      adminAlertEmail({
        subject: `Nouvelle boutique à approuver : ${name}`,
        intro: "Une boutique vient de s'inscrire sur MACHE. Ses produits n'apparaîtront dans le catalogue qu'une fois la boutique approuvée.",
        rows: [
          ["Boutique", name],
          ["Adresse de vitrine", seller.handle ? `/store/${seller.handle}` : "—"],
          ["E-mail", seller.email || "—"],
        ],
        path: "/dashboard/admin/stores",
        label: "Voir les boutiques à approuver",
      })
    );
  } catch (error) {
    logger.error(`Boutique ${event.name} : e-mail impossible (${error instanceof Error ? error.message : String(error)}).`);
  }
}

export const config: SubscriberConfig = { event: ["seller.created", "seller.approved"] };
