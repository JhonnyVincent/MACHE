/*
  SCRIPT : mise en place MACHÉ

  Le catalogue de démonstration de Mercur crée une région « Europe » en
  euros. Une marketplace haïtienne qui affiche ses prix en euros n'est pas
  une marketplace haïtienne : ce script crée la région Haïti en gourdes,
  sa région fiscale, et y active le paiement à la livraison.

  Sûreté

  - Il ne supprime rien et ne modifie aucune région existante.
  - Il est idempotent : relancé, il constate ce qui existe déjà et
    s'arrête sans rien recréer.
  - Il ne fixe aucun taux de taxe. La TCA haïtienne est une décision
    fiscale : la région est créée à zéro, et le taux se règle ensuite
    depuis le panneau d'administration, en connaissance de cause.

  Usage :
    cd packages/api
    ./node_modules/.bin/medusa exec ./src/scripts/setup-mache.ts
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createRegionsWorkflow, createTaxRegionsWorkflow } from "@medusajs/medusa/core-flows";

/*
  Haïti et la diaspora. MACHÉ vend depuis Haïti mais expédie vers les
  communautés qui commandent pour leurs proches : ces pays partagent la
  même région, donc la même devise de référence.
*/
const HAITI_COUNTRIES = ["ht"];

export default async function setupMache({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const regionService = container.resolve(Modules.REGION);
  const taxService = container.resolve(Modules.TAX);

  logger.info("Mise en place MACHÉ — région Haïti");

  /* ------------------------------------------------------------------ */
  /* Région                                                             */
  /* ------------------------------------------------------------------ */
  const existingRegions = await regionService.listRegions(
    {},
    { relations: ["countries"] }
  );

  const alreadyHaiti = existingRegions.find((region) =>
    region.countries?.some((country) => HAITI_COUNTRIES.includes(country.iso_2))
  );

  if (alreadyHaiti) {
    logger.info(
      `Région déjà en place : ${alreadyHaiti.name} (${alreadyHaiti.currency_code}). Rien à créer.`
    );
  } else {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Haïti",
            currency_code: "htg",
            countries: HAITI_COUNTRIES,
            /*
              Seul fournisseur activé : le paiement manuel. Il ne prélève
              rien et ne prétend pas le faire — c'est exactement ce
              qu'est un paiement à la livraison. Ajouter Stripe ici sans
              compte raccordé créerait un moyen de paiement qui échouerait
              au moment de payer.
            */
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });

    logger.info(
      `Région créée : ${result[0].name} — ${result[0].id} (${result[0].currency_code})`
    );
  }

  /* ------------------------------------------------------------------ */
  /* Région fiscale                                                     */
  /* ------------------------------------------------------------------ */
  const existingTaxRegions = await taxService.listTaxRegions({
    country_code: HAITI_COUNTRIES,
  });

  if (existingTaxRegions.length > 0) {
    logger.info("Région fiscale déjà en place.");
  } else {
    await createTaxRegionsWorkflow(container).run({
      input: HAITI_COUNTRIES.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    });

    logger.info(
      "Région fiscale créée, SANS taux. La TCA se règle depuis le panneau d'administration : c'est une décision fiscale, pas un réglage technique."
    );
  }

  /* ------------------------------------------------------------------ */
  /* Ce qui reste à faire à la main, et pourquoi                        */
  /* ------------------------------------------------------------------ */
  logger.info("");
  logger.info("Étapes suivantes, depuis le panneau d'administration :");
  logger.info("  1. Associer la région Haïti au canal de vente du site.");
  logger.info("  2. Créer les zones et tarifs de livraison par département.");
  logger.info("  3. Renseigner le taux de TCA si MACHÉ y est assujettie.");
  logger.info("");
  logger.info(
    "Les prix des produits existants restent dans leur devise d'origine : convertir un catalogue est une décision commerciale, pas une migration automatique."
  );
}
