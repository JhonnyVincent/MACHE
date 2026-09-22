/*
  ROUTE : les chiffres de la boutique connectée.

  Pourquoi elle existe

  Ni Medusa ni Mercur n'exposent de statistiques vendeur : leurs routes
  rendent des listes de commandes, pas des totaux. Un vendeur pouvait
  donc consulter ses commandes une par une sans jamais savoir combien il
  avait vendu ce mois-ci, ni quel article partait. Tenir une boutique
  sans ce chiffre, c'est travailler à l'aveugle.

  Rien n'est inventé

  Tout est calculé à partir des commandes réellement enregistrées. Quand
  il n'y en a aucune sur la période, la réponse le dit — elle ne comble
  pas le vide avec une moyenne, une projection ou un exemple.

  Le filtre par boutique vient de la session Mercur, jamais de la
  requête : un vendeur qui écrirait l'identifiant d'un concurrent lirait
  sinon son chiffre d'affaires.

  Les devises ne sont pas additionnées

  Une boutique qui a vendu en gourdes et en dollars n'a pas un chiffre
  d'affaires unique : les additionner produirait un nombre qui ne
  correspond à aucune somme d'argent. Chaque devise est donc rendue
  séparément.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/* Les fenêtres proposées. Au-delà, le calcul porterait sur tout l'historique. */
const ALLOWED_DAYS = [7, 30, 90, 365];
const DEFAULT_DAYS = 30;

/*
  Plafond du nombre de commandes lues. Une boutique qui dépasse ce
  volume a besoin d'un calcul agrégé en base, pas d'une lecture ligne à
  ligne — et la réponse le signale au lieu de rendre un total faux.
*/
const MAX_ORDERS = 5000;

type OrderRow = {
  id: string;
  created_at: string;
  currency_code: string | null;
  total: number | string | null;
  fulfillment_status: string | null;
  items: {
    title: string | null;
    product_title: string | null;
    quantity: number | null;
  }[] | null;
};

type Bucket = { currency_code: string; revenue: number; orders: number };

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const sellerId = (req as unknown as { seller_context?: { seller_id?: string } })
    .seller_context?.seller_id;

  if (!sellerId) {
    return res.status(401).json({ message: "Boutique non identifiée." });
  }

  const requested = Number(req.query.days);

  const days = ALLOWED_DAYS.includes(requested) ? requested : DEFAULT_DAYS;

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  /* La période précédente, de même longueur, pour donner un point de comparaison. */
  const previousFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  /*
    Les commandes de cette boutique. Sur MACHÉ, un panier à plusieurs
    vendeurs produit une commande par vendeur : le total d'une commande
    est donc bien le chiffre de cette boutique, et non celui du panier
    entier.
  */
  const { data: links } = await query.graph({
    entity: "order_seller",
    fields: ["order_id"],
    filters: { seller_id: sellerId },
  });

  const orderIds = (links as { order_id?: string }[])
    .map((link) => link.order_id)
    .filter((id): id is string => Boolean(id));

  if (orderIds.length === 0) {
    return res.json(empty(days, from, now, false));
  }

  const truncated = orderIds.length > MAX_ORDERS;

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "created_at",
      "currency_code",
      "total",
      "fulfillment_status",
      "items.title",
      "items.product_title",
      "items.quantity",
    ],
    filters: {
      id: orderIds.slice(0, MAX_ORDERS),
      created_at: { $gte: previousFrom.toISOString() },
    },
  });

  /*
    `query.graph` est typé avec le modèle complet d'une commande Medusa,
    alors que la requête n'en demande qu'une poignée de champs. Les deux
    formes ne se recouvrent donc pas, et TypeScript refuse la conversion
    directe — à juste titre : ce qui revient ici n'EST pas une commande
    complète. Le passage par `unknown` dit que la forme attendue est
    celle des champs demandés juste au-dessus, et rien d'autre.
  */
  const rows = orders as unknown as OrderRow[];

  const current: Record<string, Bucket> = {};
  const previous: Record<string, Bucket> = {};
  const products: Record<string, { title: string; quantity: number; orders: number }> = {};

  let awaiting = 0;

  for (const order of rows) {
    const placed = new Date(order.created_at);

    if (Number.isNaN(placed.getTime())) continue;

    const isCurrent = placed >= from;

    const code = (order.currency_code || "").toLowerCase() || "inconnue";

    const target = isCurrent ? current : previous;

    target[code] ??= { currency_code: code, revenue: 0, orders: 0 };

    /*
      Medusa rend les montants sous forme de grands nombres, parfois en
      texte. Laissés tels quels, ils se concatèneraient au lieu de
      s'additionner — « 1000 » + « 2000 » donnerait « 10002000 ».
    */
    target[code].revenue += Number(order.total) || 0;
    target[code].orders += 1;

    if (!isCurrent) continue;

    /*
      Une commande non expédiée est une commande à préparer. C'est le
      seul chiffre de cette page qui appelle une action immédiate.
    */
    if (
      order.fulfillment_status &&
      !["fulfilled", "shipped", "delivered", "canceled"].includes(
        order.fulfillment_status
      )
    ) {
      awaiting += 1;
    }

    for (const item of order.items ?? []) {
      const title = item.product_title || item.title;

      if (!title) continue;

      products[title] ??= { title, quantity: 0, orders: 0 };
      products[title].quantity += Number(item.quantity) || 0;
      products[title].orders += 1;
    }
  }

  const currencies = Object.values(current)
    .map((bucket) => ({
      ...bucket,
      /*
        Le panier moyen n'existe pas sans commande. Zéro se lirait
        « les clients dépensent zéro », ce qui est autre chose que
        « personne n'a commandé ».
      */
      average: bucket.orders > 0 ? Math.round(bucket.revenue / bucket.orders) : null,
      previous_revenue: previous[bucket.currency_code]?.revenue ?? 0,
      previous_orders: previous[bucket.currency_code]?.orders ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const topProducts = Object.values(products)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return res.json({
    period: {
      days,
      from: from.toISOString(),
      to: now.toISOString(),
    },
    currencies,
    top_products: topProducts,
    awaiting,
    orders: currencies.reduce((sum, bucket) => sum + bucket.orders, 0),
    /*
      Signalé plutôt que tu : un total calculé sur une partie des
      commandes serait faux sans que rien ne le dise.
    */
    truncated,
  });
}

function empty(days: number, from: Date, to: Date, truncated: boolean) {
  return {
    period: { days, from: from.toISOString(), to: to.toISOString() },
    currencies: [],
    top_products: [],
    awaiting: 0,
    orders: 0,
    truncated,
  };
}
