/*
  SCRIPT DE VÉRIFICATION : le calcul de commission de MACHÉ.

  À quoi il sert

  À répondre, sur l'installation réelle, à trois questions dont la
  mauvaise réponse coûte de l'argent sans prévenir :

  1. Quel fournisseur de commission est réellement actif ? Si les
     options du module n'étaient pas prises en compte, ce serait celui
     de Mercur — et les promotions financées par MACHÉ seraient
     silencieusement payées par les vendeurs.

     On ne peut pas le demander au conteneur de l'application :
     « commission_default_provider » est enregistré dans le conteneur
     PRIVÉ du module. Mais le module estampille chaque ligne qu'il
     renvoie avec « provider_id », rempli par ce même défaut. C'est
     donc la ligne elle-même qui répond, et sa réponse ne peut pas
     diverger de ce qui sera réellement facturé.

  2. Que calcule-t-il sans promotion ?
  3. Que calcule-t-il quand MACHÉ finance une remise ?

  Il ne modifie rien. À lancer après tout changement de configuration
  touchant les commissions :

      npx medusa exec ./src/scripts/verifier-commission.ts
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { MACHE_FUNDING_KEY } from "../modules/commission-mache";

/* La remise financée par MACHÉ dans le scénario de contrôle. */
const REMISE_FINANCEE = 400;

type LigneCommission = {
  item_id?: string | null;
  provider_id?: string | null;
  rate: number;
  amount: number | string;
};

export default async function verifierCommission({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const commission = container.resolve("commission") as {
    getCommissionLines: (context: unknown) => Promise<LigneCommission[]>;
  };

  /* Un article à 2 000, sans remise financée. */
  const base = {
    currency_code: "htg",
    order_id: "diagnostic",
    seller_id: "diagnostic",
    items: [{ id: "article_test", subtotal: 2000, tax_total: 0, total: 2000 }],
    shipping_methods: [],
  };

  const sansPromo = await commission.getCommissionLines(base);

  if (sansPromo.length === 0) {
    logger.error(
      "Aucune ligne de commission n'a été calculée : aucun taux ne correspond. Le diagnostic ne peut rien conclure — créez d'abord un taux de commission."
    );
    return;
  }

  /*
    Question 1. Le fournisseur, lu sur la ligne plutôt que supposé.
  */
  const fournisseur = sansPromo[0].provider_id ?? "(non estampillé)";

  logger.info(`Fournisseur de commission actif : ${fournisseur}`);

  if (fournisseur !== "mache") {
    logger.error(
      "ATTENTION : ce n'est pas le fournisseur de MACHÉ. Les promotions financées par MACHÉ seront payées par les vendeurs."
    );
  }

  /* Question 2. */
  const commissionSansPromo = Number(sansPromo[0].amount);

  logger.info(
    `Sans promotion — taux ${sansPromo[0].rate}, commission ${commissionSansPromo} sur un article à 2 000.`
  );

  if (commissionSansPromo === 0) {
    logger.warn(
      "Le taux en vigueur donne une commission nulle : les montants ci-dessous restent justes, mais ils ne démontrent que la soustraction, pas le taux."
    );
  }

  /* Question 3. Le même article, avec une remise financée par MACHÉ. */
  const avecPromo = await commission.getCommissionLines({
    ...base,
    items: [
      {
        id: "article_test",
        subtotal: 2000,
        tax_total: 0,
        total: 2000 - REMISE_FINANCEE,
      },
    ],
    additional_context: {
      [MACHE_FUNDING_KEY]: {
        article_test: {
          total: REMISE_FINANCEE,
          by_promotion: { promotion_de_controle: REMISE_FINANCEE },
        },
      },
    },
  });

  const commissionAvecPromo = Number(avecPromo[0]?.amount ?? NaN);
  const attendu = commissionSansPromo - REMISE_FINANCEE;

  logger.info(
    `Promotion MACHÉ de ${REMISE_FINANCEE} — commission ${commissionAvecPromo} (attendu : ${attendu}).`
  );

  if (commissionAvecPromo !== attendu) {
    logger.error(
      "ATTENTION : la remise financée par MACHÉ n'a pas été retirée de la commission. C'est le vendeur qui la paie."
    );
    return;
  }

  if (commissionAvecPromo < 0) {
    logger.info(
      `La commission est négative : MACHÉ verse ${-commissionAvecPromo} au vendeur, par-dessus le prix encaissé. C'est voulu — le chiffre d'affaires du vendeur reste celui d'une vente sans promotion.`
    );
  }

  logger.info("Vérification terminée : le calcul est conforme.");
}
