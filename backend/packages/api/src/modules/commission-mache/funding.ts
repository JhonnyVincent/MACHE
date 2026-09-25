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
  Ce que MACHÉ porte sur UN article, remise par remise.

  Un article peut cumuler plusieurs promotions : une du vendeur, une de
  MACHÉ. Seule la seconde compte ici — la première reste à la charge du
  vendeur, c'est la règle choisie.

  Le détail par promotion est conservé, pas seulement le total. C'est ce
  qui permet de répondre plus tard à « combien m'a coûté CETTE
  promotion ? ». Un total seul ne le permettrait plus : l'information
  serait perdue au moment où on la calcule, et irrécupérable ensuite.
*/
export type ItemFunding = {
  /* Ce que MACHÉ retire de sa commission sur cet article. */
  total: number;
  /* La même somme, ventilée par promotion. */
  by_promotion: Record<string, number>;
};

export function fundedForItem(
  adjustments: Adjustment[] | null | undefined,
  costs: Map<string, CostRow>
): ItemFunding {
  let total = MathBN.convert(0);
  const byPromotion: Record<string, number> = {};

  for (const adjustment of adjustments ?? []) {
    const promotionId = adjustment?.promotion_id;

    const share = marketplaceShare(promotionId ? costs.get(promotionId) : undefined);

    if (share <= 0 || !promotionId) continue;

    const amount = Number(adjustment?.amount);

    /*
      Un montant absent, nul ou négatif est ignoré. Un négatif ne peut
      être qu'une donnée corrompue, et l'additionner AUGMENTERAIT la
      commission du vendeur au lieu de la réduire.
    */
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const portion = MathBN.convert(MathBN.mult(amount, share)).toNumber();

    total = MathBN.add(total, portion);

    /*
      Additionné plutôt qu'écrasé : rien n'interdit à une commande de
      porter deux fois la même promotion sur un article.
    */
    byPromotion[promotionId] = (byPromotion[promotionId] ?? 0) + portion;
  }

  return {
    total: MathBN.convert(total).toNumber(),
    by_promotion: byPromotion,
  };
}
