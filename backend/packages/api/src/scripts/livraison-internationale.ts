/*
  SCRIPT : ouvrir la commande depuis l'étranger (voir lib/international.ts).

  Deux choses, à chaque démarrage, sans jamais rien supprimer de réel :

  1. LA RÉGION. Les pays de la diaspora rejoignent la région de MACHE
     (celle d'Haïti, en gourdes). Sans cela, une adresse en France ou
     aux États-Unis est refusée par Medusa : « Country with code fr is
     not within region Haïti ». Un pays ne peut appartenir qu'à une
     région : s'il est dans une autre (la région « Europe » de la
     démonstration), il en est retiré d'abord.

  2. UN MODE D'EXPÉDITION PAR BOUTIQUE. Chaque boutique qui a déjà un
     mode de livraison reçoit une zone « International — sur
     confirmation » et un mode « Expédition internationale — frais
     confirmés avant envoi », à 0 dans le panier. Une boutique sans
     aucune livraison configurée est laissée telle quelle : elle ne peut
     encore rien livrer, même en Haïti.

  Idempotent : relancé, il constate ce qui est en place et ne fait rien.
  Il tourne au démarrage et toutes les heures (jobs/), pour couvrir les
  boutiques qui configurent leur livraison entre deux démarrages.
*/

import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createServiceZonesWorkflow,
  updateRegionsWorkflow,
  updateServiceZonesWorkflow,
} from "@medusajs/medusa/core-flows";
import { createSellerShippingOptionsWorkflow } from "@mercurjs/core/workflows";
import {
  HOME_COUNTRY,
  INTERNATIONAL_COUNTRIES,
  INTERNATIONAL_OPTION_CODE,
  INTERNATIONAL_OPTION_NAME,
  INTERNATIONAL_ZONE_NAME,
  withCountries,
} from "../lib/international";

type ShippingOptionRow = {
  id: string;
  name?: string;
  service_zone_id?: string | null;
  shipping_profile_id?: string | null;
};

type SellerRow = {
  id: string;
  name?: string;
  shipping_options?: Array<ShippingOptionRow | null>;
};

export default async function livraisonInternationale({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const regionService = container.resolve(Modules.REGION);

  /* ------------------------------------------------------------------ */
  /* 1. La région                                                       */
  /* ------------------------------------------------------------------ */
  const regions = await regionService.listRegions({}, { relations: ["countries"] });
  const home = regions.find((region) => region.countries?.some((country) => country.iso_2 === HOME_COUNTRY));

  if (!home) {
    logger.warn("Livraison internationale : pas de région Haïti, rien à faire (la mise en place la crée).");
    return;
  }

  const homeCountries = (home.countries ?? []).map((country) => country.iso_2);
  const { all, added } = withCountries(homeCountries, INTERNATIONAL_COUNTRIES);

  if (added.length > 0) {
    for (const other of regions) {
      if (other.id === home.id) continue;

      const theirs = (other.countries ?? []).map((country) => country.iso_2);
      const keep = theirs.filter((code) => !added.includes(code));

      if (keep.length !== theirs.length) {
        await updateRegionsWorkflow(container).run({
          input: { selector: { id: other.id }, update: { countries: keep } },
        });
        logger.info(`Livraison internationale : ${theirs.length - keep.length} pays déplacé(s) de la région « ${other.name} ».`);
      }
    }

    await updateRegionsWorkflow(container).run({
      input: { selector: { id: home.id }, update: { countries: all } },
    });

    logger.info(`Livraison internationale : ${added.length} pays ajouté(s) à la région « ${home.name} » (${added.join(", ")}).`);
  }

  /* ------------------------------------------------------------------ */
  /* 2. Un mode « sur confirmation » par boutique                       */
  /* ------------------------------------------------------------------ */
  /*
    On part des modes de livraison de chaque boutique (le lien que Mercur
    tient à jour), et de leur zone on remonte à l'ensemble de livraison
    de la boutique : c'est là que la zone internationale est créée.
  */
  const fulfillment = container.resolve(Modules.FULFILLMENT);

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: [
      "id",
      "name",
      "shipping_options.id",
      "shipping_options.name",
      "shipping_options.service_zone_id",
      "shipping_options.shipping_profile_id",
    ],
  });

  let created = 0;
  let extended = 0;

  for (const seller of sellers as SellerRow[]) {
    const options = (seller.shipping_options ?? []).filter((option): option is ShippingOptionRow => Boolean(option?.id));

    /* Sans aucun mode, la boutique ne livre encore nulle part : on n'invente pas sa configuration. */
    if (options.length === 0) continue;

    const zoneIds = [...new Set(options.map((option) => option.service_zone_id).filter(Boolean))] as string[];
    const zones = zoneIds.length
      ? await fulfillment.listServiceZones({ id: zoneIds }, { relations: ["geo_zones"] })
      : [];

    const international = options.find((option) => option.name === INTERNATIONAL_OPTION_NAME);

    if (international) {
      const zone = zones.find((entry) => entry.id === international.service_zone_id);

      if (zone) {
        const codes = (zone.geo_zones ?? [])
          .filter((geo) => geo.type === "country")
          .map((geo) => String(geo.country_code || ""));
        const merged = withCountries(codes, INTERNATIONAL_COUNTRIES);

        if (merged.added.length > 0) {
          await updateServiceZonesWorkflow(container).run({
            input: {
              selector: { id: zone.id },
              update: { geo_zones: merged.all.map((country_code) => ({ country_code, type: "country" as const })) },
            },
          });
          extended += 1;
        }
      }

      continue;
    }

    const home = zones.find((zone) => zone.fulfillment_set_id);
    const profile = options.find((option) => option.shipping_profile_id)?.shipping_profile_id;

    if (!home?.fulfillment_set_id || !profile) continue;

    const { result } = await createServiceZonesWorkflow(container).run({
      input: {
        data: [
          {
            fulfillment_set_id: home.fulfillment_set_id,
            name: `${INTERNATIONAL_ZONE_NAME} — ${seller.name ?? seller.id}`,
            geo_zones: INTERNATIONAL_COUNTRIES.map((country_code) => ({ country_code, type: "country" as const })),
          },
        ],
      },
    });

    await createSellerShippingOptionsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        shipping_options: [
          {
            name: INTERNATIONAL_OPTION_NAME,
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: result[0].id,
            shipping_profile_id: profile,
            type: {
              label: "International",
              description: "Frais d'expédition communiqués et acceptés avant l'envoi.",
              code: INTERNATIONAL_OPTION_CODE,
            },
            prices: [{ currency_code: "htg", amount: 0 }],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
        ],
      },
    } as never);

    created += 1;
  }

  if (created > 0) logger.info(`Livraison internationale : mode « sur confirmation » ajouté à ${created} boutique(s).`);
  if (extended > 0) logger.info(`Livraison internationale : pays ajoutés à ${extended} zone(s) existante(s).`);
}
