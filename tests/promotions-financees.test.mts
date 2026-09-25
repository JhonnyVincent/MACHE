/*
  TEST : qui paie une promotion.

  Ce qu'il protège

  Une seule règle, mais c'est celle qui sort de l'argent :

      commission = (taux × prix PLEIN)  −  (part de MACHÉ × remise)

  Deux cas, deux conséquences opposées :

  - La promo est celle du VENDEUR. MACHÉ n'en porte rien. La commission
    est inchangée : le vendeur encaisse moins et supporte seul sa
    remise. « Si le vendeur décide de faire sa promo, c'est son
    problème. »

  - La promo est celle de MACHÉ. MACHÉ retire la remise entière de sa
    commission, quitte à ce qu'elle devienne négative — auquel cas
    MACHÉ verse la différence. Le vendeur touche alors exactement ce
    qu'il aurait touché sans promotion : son chiffre d'affaires n'est
    pas touché, celui de MACHÉ l'est.

  Pourquoi un test et pas une relecture

  Parce qu'une erreur ici ne se voit pas : elle produit un virement
  plausible, du mauvais montant, sur chaque commande en promotion. Une
  inversion de la part, un plafonnement à zéro « défensif » ajouté par
  prudence, un défaut de 50 % sur un partage non renseigné — chacun
  passe la relecture et coûte de l'argent en silence.

  Lancer : npm run test:promotions
*/

import assert from "node:assert/strict";
import {
  marketplaceShare,
  fundedForItem,
  type CostRow,
} from "../backend/packages/api/src/modules/commission-mache/funding.ts";
import { MacheCommissionProvider } from "../backend/packages/api/src/modules/commission-mache/service.ts";

let passed = 0;

function check(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

async function checkAsync(name: string, run: () => Promise<void>) {
  await run();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

/* ------------------------------------------------------------------ */
/* La part portée par MACHÉ                                            */
/* ------------------------------------------------------------------ */

check("une promotion du vendeur n'est portée par MACHÉ à aucun degré", () => {
  assert.equal(marketplaceShare({ promotion_id: "p", cost_bearer: "store" }), 0);
});

check("une promotion de MACHÉ est portée en entier", () => {
  assert.equal(
    marketplaceShare({ promotion_id: "p", cost_bearer: "marketplace" }),
    1
  );
});

check("une promotion partagée est portée à hauteur du pourcentage saisi", () => {
  assert.equal(
    marketplaceShare({
      promotion_id: "p",
      cost_bearer: "shared",
      shared_marketplace_percentage: 40,
    }),
    0.4
  );
});

check("un partage sans pourcentage ne coûte rien à MACHÉ", () => {
  /*
    Le piège : traiter « partagé » comme « moitié-moitié ». MACHÉ
    paierait alors la moitié de remises que personne n'a chiffrées.
  */
  for (const percentage of [null, undefined, 0, -10, Number.NaN]) {
    assert.equal(
      marketplaceShare({
        promotion_id: "p",
        cost_bearer: "shared",
        shared_marketplace_percentage: percentage as number | null,
      }),
      0,
      `un pourcentage « ${String(percentage)} » ne doit rien faire payer à MACHÉ`
    );
  }
});

check("un partage au-delà de 100 % est ramené à la remise entière", () => {
  assert.equal(
    marketplaceShare({
      promotion_id: "p",
      cost_bearer: "shared",
      shared_marketplace_percentage: 250,
    }),
    1,
    "MACHÉ ne peut pas porter plus que la remise elle-même"
  );
});

check("un porteur inconnu, ou absent, ne coûte rien à MACHÉ", () => {
  assert.equal(marketplaceShare(undefined), 0);
  assert.equal(marketplaceShare(null), 0);
  assert.equal(
    marketplaceShare({ promotion_id: "p", cost_bearer: "n'importe quoi" }),
    0,
    "une valeur inattendue ne doit jamais sortir d'argent"
  );
});

/* ------------------------------------------------------------------ */
/* Ce que MACHÉ porte sur un article                                   */
/* ------------------------------------------------------------------ */

const costs = new Map<string, CostRow>([
  ["promo_mache", { promotion_id: "promo_mache", cost_bearer: "marketplace" }],
  ["promo_vendeur", { promotion_id: "promo_vendeur", cost_bearer: "store" }],
  [
    "promo_partagee",
    {
      promotion_id: "promo_partagee",
      cost_bearer: "shared",
      shared_marketplace_percentage: 25,
    },
  ],
]);

check("une remise du vendeur ne remonte pas", () => {
  assert.deepEqual(
    fundedForItem([{ promotion_id: "promo_vendeur", amount: 400 }], costs),
    { total: 0, by_promotion: {} }
  );
});

check("une remise de MACHÉ remonte en entier", () => {
  assert.deepEqual(
    fundedForItem([{ promotion_id: "promo_mache", amount: 400 }], costs),
    { total: 400, by_promotion: { promo_mache: 400 } }
  );
});

check("un article cumulant les deux ne fait porter que celle de MACHÉ", () => {
  /*
    Le cas réel : le vendeur solde son article ET MACHÉ ajoute un geste
    commercial. Confondre les deux ferait payer MACHÉ pour la remise du
    vendeur.
  */
  assert.deepEqual(
    fundedForItem(
      [
        { promotion_id: "promo_vendeur", amount: 300 },
        { promotion_id: "promo_mache", amount: 400 },
      ],
      costs
    ),
    { total: 400, by_promotion: { promo_mache: 400 } }
  );
});

check("les remises partagées s'additionnent au prorata", () => {
  /*
    25 % de 400 = 100, plus 100 entièrement portés : 200 au total, et
    le détail dit laquelle des deux promotions a coûté quoi.
  */
  assert.deepEqual(
    fundedForItem(
      [
        { promotion_id: "promo_partagee", amount: 400 },
        { promotion_id: "promo_mache", amount: 100 },
      ],
      costs
    ),
    { total: 200, by_promotion: { promo_partagee: 100, promo_mache: 100 } }
  );
});

check("une promotion inconnue du registre des coûts est à la charge du vendeur", () => {
  /*
    Le défaut prudent : tant que personne n'a déclaré qui paie, ce
    n'est pas MACHÉ. C'est aussi le comportement d'avant ce travail,
    donc rien ne change pour les promotions existantes.
  */
  assert.deepEqual(
    fundedForItem([{ promotion_id: "jamais_declaree", amount: 400 }], costs),
    { total: 0, by_promotion: {} }
  );
});

check("un montant absurde est ignoré plutôt que soustrait", () => {
  for (const amount of [null, undefined, 0, -400, Number.NaN]) {
    assert.deepEqual(
      fundedForItem(
        [{ promotion_id: "promo_mache", amount: amount as number | null }],
        costs
      ),
      { total: 0, by_promotion: {} },
      `un montant « ${String(amount)} » ne doit pas modifier la commission`
    );
  }
});

/* ------------------------------------------------------------------ */
/* Le fournisseur : la soustraction elle-même                          */
/* ------------------------------------------------------------------ */

/*
  Un faux fournisseur `system` qui applique 8 % au sous-total PLEIN,
  comme le vrai. Le vrai est vérifié séparément, sur un vrai conteneur,
  par `verifier-commission.ts` ; ici on vérifie la correction que MACHÉ
  lui applique, isolément.
*/
function conteneur(taux = 8) {
  return {
    cp_system: {
      getCommissionLines: async (context: {
        items?: { id: string; subtotal: number }[];
        shipping_methods?: { id: string; subtotal: number }[];
      }) => [
        ...(context.items ?? []).map((item) => ({
          item_id: item.id,
          shipping_method_id: null,
          code: "default",
          rate: taux,
          amount: (item.subtotal * taux) / 100,
          provider_id: "system",
        })),
        ...(context.shipping_methods ?? []).map((method) => ({
          item_id: null,
          shipping_method_id: method.id,
          code: "default",
          rate: taux,
          amount: (method.subtotal * taux) / 100,
          provider_id: "system",
        })),
      ],
    },
  };
}

const article = {
  currency_code: "htg",
  order_id: "commande",
  seller_id: "vendeur",
  items: [{ id: "article", subtotal: 2000 }],
  shipping_methods: [],
};

await checkAsync("sans rien de financé, la commission est celle de Mercur", async () => {
  const provider = new MacheCommissionProvider(conteneur() as never);
  const [line] = await provider.getCommissionLines(article as never);

  assert.equal(Number(line.amount), 160, "8 % de 2 000");
});

await checkAsync("la promo du vendeur ne change pas la commission", async () => {
  /*
    Le vendeur solde 400. MACHÉ n'en porte rien, donc rien ne remonte,
    donc la commission reste 160 : le vendeur encaisse 1 600 et touche
    1 440. C'est le comportement d'aujourd'hui, inchangé.
  */
  const provider = new MacheCommissionProvider(conteneur() as never);
  const [line] = await provider.getCommissionLines({
    ...article,
    additional_context: {},
  } as never);

  assert.equal(Number(line.amount), 160);
});

await checkAsync("la promo de MACHÉ sort du chiffre d'affaires de MACHÉ", async () => {
  /*
    Le chiffre qui compte. MACHÉ finance 400 sur un article à 2 000 :
    commission 160 − 400 = −240. Le vendeur encaisse 1 600 et reçoit
    240 de plus, soit 1 840 — exactement ce qu'il aurait touché sans
    promotion (2 000 − 160). Son chiffre d'affaires est intact.
  */
  const provider = new MacheCommissionProvider(conteneur() as never);
  const [line] = await provider.getCommissionLines({
    ...article,
    additional_context: {
      mache_funded_discounts: {
        article: { total: 400, by_promotion: { promo_mache: 400 } },
      },
    },
  } as never);

  assert.equal(Number(line.amount), -240, "la commission devient négative");

  const verseAuVendeur = 1600 - Number(line.amount);

  assert.equal(verseAuVendeur, 1840, "le vendeur touche comme s'il n'y avait pas eu de promo");
  assert.equal(verseAuVendeur, 2000 - 160, "soit le prix plein moins la commission habituelle");
});

await checkAsync("une commission négative n'est pas ramenée à zéro", async () => {
  /*
    Le plafonnement « défensif » est le bug le plus tentant de tout ce
    fichier : il fait disparaître un chiffre qui a l'air faux. Il
    ferait payer au vendeur la promotion de MACHÉ.
  */
  const provider = new MacheCommissionProvider(conteneur() as never);
  const [line] = await provider.getCommissionLines({
    ...article,
    additional_context: {
      mache_funded_discounts: {
        article: { total: 2000, by_promotion: { promo_mache: 2000 } },
      },
    },
  } as never);

  assert.equal(Number(line.amount), -1840);
});

await checkAsync("la ligne garde la trace de ce que MACHÉ a financé", async () => {
  /*
    Sans cela, −240 est un chiffre inexplicable six mois plus tard : on
    saurait qu'on a payé, pas pourquoi.
  */
  const provider = new MacheCommissionProvider(conteneur() as never);
  const [line] = await provider.getCommissionLines({
    ...article,
    additional_context: {
      mache_funded_discounts: {
        article: { total: 400, by_promotion: { promo_mache: 400 } },
      },
    },
  } as never);

  assert.equal(line.data?.mache_funded_discount, 400);
  assert.equal(line.data?.mache_commission_before_funding, 160);
  assert.deepEqual(line.data?.mache_funded_by_promotion, { promo_mache: 400 });
});

await checkAsync("les frais de port ne se voient pas retirer la remise", async () => {
  /*
    Une ligne de frais de port ne porte pas de remise d'article. Lui en
    soustraire une ferait payer deux fois la même promotion à MACHÉ.
  */
  const provider = new MacheCommissionProvider(conteneur() as never);
  const lines = await provider.getCommissionLines({
    ...article,
    shipping_methods: [{ id: "livraison", subtotal: 500 }],
    additional_context: {
      mache_funded_discounts: {
        article: { total: 400, by_promotion: { promo_mache: 400 } },
      },
    },
  } as never);

  const port = lines.find((line) => line.shipping_method_id === "livraison");

  assert.equal(Number(port?.amount), 40, "8 % de 500, intacts");
});

await checkAsync("chaque ligne est signée par le fournisseur de MACHÉ", async () => {
  /*
    Mercur inscrit lui-même « system » sur les lignes qu'il fabrique.
    Relayées telles quelles, elles attribueraient la commission à un
    fournisseur qui n'a pas produit le montant final — et on n'aurait
    plus aucun moyen de vérifier, en production, lequel des deux
    calcule réellement.
  */
  const provider = new MacheCommissionProvider(conteneur() as never);

  const sansPromo = await provider.getCommissionLines(article as never);
  const avecPromo = await provider.getCommissionLines({
    ...article,
    additional_context: {
      mache_funded_discounts: {
        article: { total: 400, by_promotion: { promo_mache: 400 } },
      },
    },
  } as never);

  for (const line of [...sansPromo, ...avecPromo]) {
    assert.equal(line.provider_id, "mache");
  }
});

await checkAsync("un fournisseur Mercur absent arrête tout au lieu d'improviser", async () => {
  /*
    Retomber sur un calcul maison produirait des commissions
    silencieusement différentes de celles de Mercur, et personne ne
    s'en apercevrait avant de comparer des relevés.
  */
  const provider = new MacheCommissionProvider({} as never);

  await assert.rejects(
    () => provider.getCommissionLines(article as never),
    /introuvable/,
    "l'absence du fournisseur de Mercur doit être bruyante"
  );
});

console.log(`\n${passed} vérifications passées.\n`);
