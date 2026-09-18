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
import {
  createRegionsWorkflow,
  createTaxRegionsWorkflow,
  createSalesChannelsWorkflow,
  createApiKeysWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows";

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
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
  const apiKeyService = container.resolve(Modules.API_KEY);
  const storeService = container.resolve(Modules.STORE);

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
  /* Canal de vente                                                     */
  /* ------------------------------------------------------------------ */
  /*
    Un canal de vente désigne « par où on vend ». Le site en est un.
    Medusa en crée un par défaut à l'installation ; on le réutilise
    plutôt que d'en empiler un second, qui obligerait à rattacher tous
    les produits deux fois.
  */
  const [store] = await storeService.listStores({});

  const channels = await salesChannelService.listSalesChannels({});

  /*
    Lequel est « celui du site » ? La boutique le désigne elle-même.
    Prendre le premier de la liste marcherait tant qu'il n'y en a qu'un,
    et rattacherait la clé publique au mauvais canal le jour où un
    second apparaît — le site n'afficherait alors plus rien.
  */
  let channel =
    channels.find((entry) => entry.id === store?.default_sales_channel_id) ??
    channels.find((entry) => !entry.is_disabled);

  if (!channel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Site MACHÉ" }] },
    });

    channel = result[0];

    logger.info(`Canal de vente créé : ${channel.name} — ${channel.id}`);
  } else {
    logger.info(`Canal de vente déjà en place : ${channel.name} — ${channel.id}`);
  }

  /* ------------------------------------------------------------------ */
  /* Clé publique du site                                               */
  /* ------------------------------------------------------------------ */
  /*
    Sans elle, le site ne peut rien lire du catalogue : toutes ses
    requêtes sont refusées. Elle se créait jusqu'ici à la main dans le
    panneau d'administration, ce qui suppose d'y être déjà entré — donc
    d'avoir créé un compte, donc d'avoir ouvert un terminal. Beaucoup
    d'étapes pour une valeur que ce script peut produire lui-même.

    Elle n'est pas secrète : elle voyage dans le navigateur de chaque
    visiteur. Elle dit seulement « ces requêtes concernent ce canal de
    vente ». L'afficher dans les journaux du déploiement ne l'expose donc
    à rien de plus que la visite d'une page.
  */
  const existingKeys = await apiKeyService.listApiKeys({ type: "publishable" });

  const liveKey = existingKeys.find((key) => !key.revoked_at);

  let publishableKey = liveKey?.token ?? "";

  if (liveKey) {
    logger.info(`Clé publique déjà en place : ${liveKey.title}`);

    /*
      Une clé qui n'est rattachée à aucun canal de vente est acceptée par
      le backend et ne renvoie aucun produit. C'est la panne la plus
      déroutante possible : le site répond, n'affiche rien, et rien
      n'indique pourquoi. On vérifie donc le rattachement, et on le pose
      s'il manque.
    */
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data } = await query.graph({
      entity: "api_key",
      fields: ["id", "sales_channels.id"],
      filters: { id: liveKey.id },
    });

    const linked = (data[0]?.sales_channels ?? []).some(
      (entry: { id: string } | null) => entry?.id === channel.id
    );

    if (!linked) {
      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: { id: liveKey.id, add: [channel.id] },
      });

      logger.info("Clé publique rattachée au canal de vente : elle ne l'était pas, et ne renvoyait donc aucun produit.");
    }
  } else {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            type: "publishable",
            title: "Site MACHÉ",
            created_by: "setup-mache",
          },
        ],
      },
    });

    publishableKey = result[0].token;

    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: result[0].id, add: [channel.id] },
    });

    logger.info("Clé publique créée et rattachée au canal de vente.");
  }

  /* ------------------------------------------------------------------ */
  /* Région par défaut de la boutique                                   */
  /* ------------------------------------------------------------------ */
  const haiti =
    alreadyHaiti ??
    (await regionService.listRegions({}, { relations: ["countries"] })).find(
      (region) =>
        region.countries?.some((country) => HAITI_COUNTRIES.includes(country.iso_2))
    );

  /*
    La boutique désigne une région par défaut. Tant qu'elle pointait sur
    l'Europe, un écran qui ne précise pas de région raisonnait en euros
    sur une marketplace haïtienne.
  */
  if (store && haiti && store.default_region_id !== haiti.id) {
    await storeService.updateStores(store.id, { default_region_id: haiti.id });

    logger.info(`Région par défaut de la boutique : Haïti (${haiti.id}).`);
  }

  const publicUrl = (process.env.RENDER_EXTERNAL_URL || "").replace(/\/+$/, "");

  logger.info("");
  logger.info("========================================================");
  logger.info("  À reporter dans les variables d'environnement du site");
  logger.info("  (Vercel → Settings → Environment Variables), PUIS");
  logger.info("  REDÉPLOYER : ces valeurs sont lues à la construction.");
  logger.info("--------------------------------------------------------");
  logger.info(`  NEXT_PUBLIC_MEDUSA_BACKEND_URL=${publicUrl || "<adresse publique de ce serveur>"}`);
  logger.info(`  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${publishableKey}`);
  logger.info(`  NEXT_PUBLIC_MEDUSA_REGION_ID=${haiti?.id ?? "<région introuvable>"}`);
  logger.info("========================================================");
  logger.info("");

  /* ------------------------------------------------------------------ */
  /* Ce qui reste à faire à la main, et pourquoi                        */
  /* ------------------------------------------------------------------ */
  logger.info("Ce que ce script ne décide pas à votre place :");
  logger.info("  1. Les zones et tarifs de livraison, par département.");
  logger.info("  2. Le taux de TCA, si MACHÉ y est assujettie.");
  logger.info("  3. Le taux de commission prélevé sur les ventes.");
  logger.info("");
  logger.info(
    "Les prix des produits existants restent dans leur devise d'origine : convertir un catalogue est une décision commerciale, pas une migration automatique."
  );
}
