/*
  LA PART QUE MACHÉ PORTE SUR UNE REMISE.

  Ce fichier ne contient que de l'arithmétique : pas de conteneur, pas
  de requête, pas de hook. C'est délibéré. La règle qu'il applique
  décide combien MACHÉ débourse sur chaque promotion ; elle doit
  pouvoir être vérifiée sans démarrer un serveur, et elle l'est
  (`npm run test:promotions`).

  Le hook, lui, va chercher les données et appelle ces fonctions.
*/

import { MathBN } from "@medusajs/framework/utils";

/* Une ligne de `promotion_cost` : qui porte le coût de la promotion. */
export type CostRow = {
  promotion_id: string;
  cost_bearer: string;
  shared_marketplace_percentage?: number | null;
};

/* Une remise appliquée à un article. */
export type Adjustment = {
  amount?: number | string | null;
  promotion_id?: string | null;
};

/*
  La part portée par MACHÉ, entre 0 et 1.

  Un pourcentage manquant sur une promotion « partagée » vaut zéro, pas
  la moitié : inventer un partage ferait débourser MACHÉ sur la foi
  d'une donnée que personne n'a saisie.

  Tout ce qui n'est pas reconnu vaut zéro, pour la même raison. Une
  valeur inattendue dans `cost_bearer` ne doit jamais coûter d'argent.
*/
export function marketplaceShare(cost: CostRow | undefined | null): number {
  if (!cost) return 0;

  if (cost.cost_bearer === "marketplace") return 1;

  if (cost.cost_bearer === "shared") {
    const percentage = Number(cost.shared_marketplace_percentage);

    if (!Number.isFinite(percentage) || percentage <= 0) return 0;

    /* Borné à 100 % : au-delà, MACHÉ paierait plus que la remise. */
    return Math.min(percentage, 100) / 100;
  }

  return 0;
}

/*
  Ce que MACHÉ porte sur UN article, toutes ses remises additionnées.

  Un article peut cumuler plusieurs promotions : une du vendeur, une de
  MACHÉ. Seule la seconde compte ici — la première reste à la charge du
  vendeur, c'est la règle choisie.
*/
export function fundedForItem(
  adjustments: Adjustment[] | null | undefined,
  costs: Map<string, CostRow>
): number {
  let funded = MathBN.convert(0);

  for (const adjustment of adjustments ?? []) {
    const share = marketplaceShare(
      adjustment?.promotion_id ? costs.get(adjustment.promotion_id) : undefined
    );

    if (share <= 0) continue;

    const amount = Number(adjustment?.amount);

    /*
      Un montant absent, nul ou négatif est ignoré. Un négatif ne peut
      être qu'une donnée corrompue, et l'additionner AUGMENTERAIT la
      commission du vendeur au lieu de la réduire.
    */
    if (!Number.isFinite(amount) || amount <= 0) continue;

    funded = MathBN.add(funded, MathBN.mult(amount, share));
  }

  return MathBN.convert(funded).toNumber();
}
