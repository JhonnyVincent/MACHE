/*
  SCRIPT DE VÉRIFICATION : le gel des versements retient-il vraiment ?

  La question qui coûte de l'argent si on la suppose : une livraison
  confirmée par un code VALIDE, dans une boutique gelée, laisse-t-elle
  sa somme retenue — ou la porte-t-elle comme due malgré le gel ?

      npx medusa exec ./src/scripts/verifier-gel.ts
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { DELIVERY_MODULE } from "../modules/delivery";
import { confirmDelivery } from "../api/delivery-confirm";
import type { DeliveryRow } from "../api/delivery-helpers";

export default async function verifierGel({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const service = container.resolve(DELIVERY_MODULE) as {
    createDeliveries: (data: Record<string, unknown>) => Promise<DeliveryRow>;
    deleteDeliveries: (ids: string[]) => Promise<void>;
    createPayoutFreezes: (data: Record<string, unknown>) => Promise<{ id: string }>;
    deletePayoutFreezes: (ids: string[]) => Promise<void>;
  };

  const seller = `sonde_gel_${Date.now()}`;

  async function livraisonNeuve(code: string) {
    return service.createDeliveries({
      order_id: `cmd_${Date.now()}`,
      seller_id: seller,
      access_token: "jeton-de-sonde",
      method: "seller",
      code,
      status: "in_transit",
    });
  }

  /* 1. Boutique NON gelée : le bon code doit libérer. */
  const libre = await livraisonNeuve("ABC234");

  const sansGel = await confirmDelivery(
    container as never,
    libre,
    { code: "ABC234" },
    "seller"
  );

  const etatSansGel = sansGel.ok ? sansGel.delivery.payout_state : "(refusé)";

  logger.info(`Sans gel — payout_state = ${etatSansGel} (attendu : releasable)`);

  if (etatSansGel !== "releasable") {
    logger.error("ATTENTION : une boutique saine ne libère plus ses versements.");
  }

  /* 2. Boutique GELÉE : le même bon code ne doit PAS libérer. */
  const gel = await service.createPayoutFreezes({
    seller_id: seller,
    reason: "sonde",
    active: true,
  });

  const retenue = await livraisonNeuve("XYZ789");

  const avecGel = await confirmDelivery(
    container as never,
    retenue,
    { code: "XYZ789" },
    "seller"
  );

  const etatAvecGel = avecGel.ok ? avecGel.delivery.payout_state : "(refusé)";
  const statutAvecGel = avecGel.ok ? avecGel.delivery.status : "(refusé)";

  logger.info(
    `Avec gel — statut = ${statutAvecGel} (attendu : delivered), payout_state = ${etatAvecGel} (attendu : held)`
  );

  if (statutAvecGel !== "delivered") {
    logger.error(
      "ATTENTION : le gel empêche d'enregistrer la remise. La livraison est un FAIT, elle doit rester enregistrée."
    );
  }

  if (etatAvecGel !== "held") {
    logger.error(
      "ATTENTION : le gel ne retient RIEN. Une boutique sous enquête voit ses versements libérés."
    );
  } else {
    logger.info("Le gel retient : la remise est enregistrée, la somme ne part pas.");
  }

  await service.deleteDeliveries([libre.id, retenue.id]);
  await service.deletePayoutFreezes([gel.id]);
  logger.info("sonde nettoyée");
}
