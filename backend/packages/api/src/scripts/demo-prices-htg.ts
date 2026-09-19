/*
  SCRIPT : donner un prix en gourdes au catalogue de démonstration.

  Le problème qu'il règle

  Le catalogue de démonstration de Mercur est chiffré en euros et en
  dollars. MACHÉ vend en gourdes, et Medusa refuse — à juste titre — de
  calculer un prix dans une devise pour laquelle aucun prix n'existe.

  Résultat, avec SEED_DEMO et la région Haïti : douze produits affichés,
  vingt-quatre mentions « Prix indisponible », et aucun article qui peut
  entrer dans un panier. Une démonstration où rien ne s'achète n'en est
  pas une. Constaté sur le site avant d'écrire ce script.

  Ce que le facteur est, et n'est pas

  Ce N'EST PAS un taux de change. Personne ici ne connaît le cours de la
  gourde, et l'inventer pour de vrais produits serait une décision
  commerciale déguisée en migration technique.

  Ce sont des chaussures fictives vendues par des boutiques fictives :
  le facteur ne fait que produire des montants d'un ordre de grandeur
  plausible, pour qu'une démonstration ressemble à une boutique. Il est
  affiché dans les journaux, et se règle avec DEMO_HTG_FACTOR.

  Sûreté

  - il ne touche qu'aux offres qui n'ont AUCUN prix en gourdes ;
  - il conserve les prix existants et leurs paliers de quantité — les
    mises à jour d'offres remplacent la grille entière, omettre une
    ligne l'effacerait ;
  - il reprend les seuils de quantité, pour que les prix dégressifs se
    démontrent aussi en gourdes ;
  - relancé, il constate que tout est en place et ne fait rien.
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateOffersWorkflow } from "@mercurjs/core/workflows";

/* Montants d'un ordre de grandeur plausible, rien de plus. */
const DEFAULT_FACTOR = 140;

type PriceRow = {
  id: string;
  amount: number;
  currency_code: string;
  min_quantity: number | null;
  max_quantity: number | null;
};

/*
  Quels prix appartiennent à une offre.

  Les prix vivent dans la grille de la VARIANTE, partagée entre tous les
  vendeurs qui la proposent. Ce qui rattache un prix à une offre n'est
  pas une règle lisible dans la grille, mais un LIEN que Mercur pose
  entre l'offre et le prix — c'est cette liste-là qu'il compare quand on
  lui envoie une mise à jour, et lui envoyer le prix d'un concurrent le
  fait refuser, à juste titre.

  `query.graph` sur `offer.prices` suit ce lien. Un lien dont le prix a
  disparu rend un élément vide : on l'écarte, comme le fait Mercur.
*/
function ownedPrices(prices: (PriceRow | null | undefined)[]): PriceRow[] {
  return prices.filter((price): price is PriceRow => Boolean(price?.id));
}

export default async function demoPricesHtg({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const factor = Number(process.env.DEMO_HTG_FACTOR) || DEFAULT_FACTOR;

  /*
    Les offres sont relues par lots, avec un filtre sur leurs
    identifiants — c'est ainsi que Mercur interroge lui-même ses prix.

    Demander toutes les offres d'un coup semblait plus simple et rendait
    des grilles mélangées : plusieurs offres partagent la grille d'une
    même variante, et le graphe rattachait à l'une les prix d'une autre.
    Mercur refusait alors la mise à jour — et il avait raison : acceptée,
    un vendeur aurait écrasé les prix de son concurrent.
  */
  const { data: all } = await query.graph({
    entity: "offer",
    fields: ["id", "variant_id"],
  });

  const offerIds = (all as { id: string }[]).map((offer) => offer.id);

  logger.info(`Prix en gourdes : ${offerIds.length} offre(s) à examiner.`);

  const BATCH = 20;

  let completed = 0;
  let already = 0;
  let unpriced = 0;

  for (let i = 0; i < offerIds.length; i += BATCH) {
    const slice = offerIds.slice(i, i + BATCH);

    const { data: rows } = await query.graph({
      entity: "offer",
      fields: [
        "id",
        "variant_id",
        "prices.id",
        "prices.amount",
        "prices.currency_code",
        "prices.min_quantity",
        "prices.max_quantity",
      ],
      filters: { id: slice },
    });

    const updates: { id: string; prices: unknown[] }[] = [];

    for (const offer of rows as {
      id: string;
      variant_id?: string;
      prices?: (PriceRow | null)[];
    }[]) {
      const prices = ownedPrices(offer.prices ?? []);

      /*
        Offre sans aucun prix atteignable.

        Le catalogue de démonstration en produit : quand deux vendeurs
        proposent la même variante au même montant, les deux lignes de
        prix sont identiques et la grille partagée n'en garde qu'une —
        le second vendeur garde un lien vers un prix qui n'existe plus.
        Quatre-vingt-seize offres sur deux cent quarante-quatre, sur une
        base vierge.

        On les laisse telles quelles, et voici pourquoi.

        La réparation évidente — reprendre les montants d'une offre
        voisine — a été essayée et REND LA SITUATION PIRE : le montant
        identique fusionne à son tour, et c'est le voisin qui perd son
        prix. Mesuré : cent quarante-huit offres vendables avant, cent
        vingt-trois après, et cinq cent cinquante-cinq liens orphelins.

        Donner un montant différent les réparerait, mais ce serait
        inventer le prix d'un vendeur. Sur des données de démonstration
        ce serait tolérable ; le même code tournant un jour sur un vrai
        catalogue ne le serait pas. On préfère compter et le dire.
      */
      if (prices.length === 0) {
        unpriced += 1;
        continue;
      }

      if (prices.some((price) => price.currency_code?.toLowerCase() === "htg")) {
        already += 1;
        continue;
      }

      /*
        La grille part en entier : les lignes omises seraient supprimées.
        Les prix existants gardent leur identifiant, les nouvelles lignes
        n'en ont pas.
      */
      const kept = prices.map((price) => ({
        id: price.id,
        amount: price.amount,
        currency_code: price.currency_code,
        min_quantity: price.min_quantity,
        max_quantity: price.max_quantity,
      }));

      const added = prices
        .filter((price) => price.currency_code?.toLowerCase() === "eur")
        .map((price) => ({
          amount: Math.max(1, Math.round(price.amount * factor)),
          currency_code: "htg",
          /* Les seuils sont repris : les prix dégressifs se démontrent aussi en gourdes. */
          min_quantity: price.min_quantity,
          max_quantity: price.max_quantity,
        }));

      if (added.length === 0) continue;

      updates.push({ id: offer.id, prices: [...kept, ...added] });
    }

    if (updates.length > 0) {
      await updateOffersWorkflow(container).run({
        input: { offers: updates as never },
      });

      completed += updates.length;
    }

    logger.info(`  ${Math.min(i + BATCH, offerIds.length)} / ${offerIds.length}`);
  }

  logger.info("");

  if (completed === 0) {
    logger.info(
      `Rien à faire : ${already} offre(s) avaient déjà un prix en gourdes.`
    );

    if (unpriced > 0) {
      logger.warn(
        `${unpriced} offre(s) de démonstration n'ont aucun prix et resteront invendables.`
      );
    }

    return;
  }

  logger.info(
    `${completed} offre(s) complétées, ${already} l'étaient déjà.`
  );

  if (unpriced > 0) {
    logger.warn(
      `${unpriced} offre(s) de démonstration n'ont aucun prix et resteront invendables. C'est un défaut du catalogue de démonstration, sans effet sur un vrai catalogue.`
    );
  }
  logger.info(
    `Ce n'est PAS un taux de change : les montants en euros ont été multipliés par ${factor} pour donner des ordres de grandeur plausibles à une boutique fictive.`
  );
}
