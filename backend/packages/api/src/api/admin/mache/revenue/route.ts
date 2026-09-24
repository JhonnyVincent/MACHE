/*
  ROUTE : ce que MACHÉ gagne.

  Pourquoi elle existe

  Le panneau d'administration de Mercur montre les commandes, les
  vendeurs, les versements. Il ne dit nulle part ce que la PLACE DE
  MARCHÉ elle-même encaisse. Un dirigeant qui veut savoir combien MACHÉ
  a gagné ce mois-ci n'a aujourd'hui aucun écran à ouvrir.

  D'où viennent les chiffres

  Des lignes de commission réellement enregistrées à chaque commande.
  Pas d'un taux multiplié par un total : le taux a changé, il change
  encore, et un vendeur peut avoir le taux réduit. Recalculer à partir
  du taux du jour donnerait un chiffre faux pour tout l'historique.

  Les devises ne sont pas additionnées

  Une commission de 1 400 HTG et une de 12 € ne font pas « 1 412 ». Les
  additionner produirait un nombre qui ne correspond à aucune somme
  d'argent. Chaque devise est rendue séparément, et l'écran les affiche
  côte à côte.

  Ce que la réponse ne contient pas, et pourquoi

  Les abonnements des marques officielles. MACHÉ ne les facture pas
  encore : il n'existe aucun prélèvement, aucune échéance, rien à
  compter. Ajouter ici une ligne « abonnements » remplie à partir de la
  grille tarifaire afficherait comme encaissé un argent que personne
  n'a versé — c'est-à-dire un chiffre d'affaires imaginaire, sur
  l'écran même où l'on décide.

  Attention à ce que « encaissé » veut dire

  MACHÉ ne perçoit pas les paiements : l'acheteur règle le vendeur en
  main propre. Ces commissions sont donc DUES à MACHÉ, pas reçues. La
  réponse porte ce mot, et l'écran le répète — confondre les deux, c'est
  se croire riche d'un argent qu'il reste à réclamer.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

const ALLOWED_DAYS = [7, 30, 90, 365];
const DEFAULT_DAYS = 30;

/*
  Plafond de lecture. Au-delà, ce calcul ligne à ligne n'est plus le bon
  outil — il faudra une agrégation en base. La réponse le signale plutôt
  que de rendre un total silencieusement tronqué.
*/
const MAX_ORDERS = 5000;

type OrderRow = {
  id: string;
  created_at: string;
  currency_code: string | null;
  total: number | string | null;
  items: { id: string }[] | null;
};

type CommissionLineRow = {
  id: string;
  item_id: string | null;
  shipping_method_id: string | null;
  rate: number | null;
  amount: number | string | null;
};

type Bucket = {
  currency_code: string;
  /* Ce que les acheteurs ont payé aux vendeurs, dans cette devise. */
  volume: number;
  /* Ce que MACHÉ a gagné dessus. */
  commission: number;
  orders: number;
};

function bucketOf(map: Record<string, Bucket>, currency: string): Bucket {
  if (!map[currency]) {
    map[currency] = { currency_code: currency, volume: 0, commission: 0, orders: 0 };
  }

  return map[currency];
}

function num(value: number | string | null | undefined): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

/*
  Le taux moyen réellement constaté, et non le taux affiché.

  Il se calcule en divisant la commission par le volume : c'est le seul
  chiffre qui tienne compte des taux réduits, des taux hérités et des
  commandes passées sous un ancien barème. Écart entre lui et les 8 %
  annoncés = quelque chose à comprendre.

  `null` quand le volume est nul : diviser par zéro rendrait `Infinity`
  ou `NaN`, et un écran qui affiche « NaN % » a perdu son lecteur.
*/
function effectiveRate(bucket: Bucket): number | null {
  if (bucket.volume <= 0) return null;

  return Math.round((bucket.commission / bucket.volume) * 10000) / 100;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const requested = Number(req.query.days);

  const days = ALLOWED_DAYS.includes(requested) ? requested : DEFAULT_DAYS;

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "created_at", "currency_code", "total", "items.id"],
    filters: { created_at: { $gte: previousFrom.toISOString() } },
  });

  /*
    `query.graph` est typé avec le modèle complet d'une commande, alors
    que la requête n'en demande qu'une poignée de champs. Les deux
    formes ne se recouvrent pas, et le passage par `unknown` dit que ce
    qui revient est la forme demandée juste au-dessus, rien d'autre.
  */
  const rows = (orders as unknown as OrderRow[]) ?? [];

  const truncated = rows.length > MAX_ORDERS;

  const kept = rows.slice(0, MAX_ORDERS);

  /*
    Quel article appartient à quelle commande. Une ligne de commission
    ne porte pas de devise : elle pointe l'article, et c'est la commande
    de cet article qui dit en quelle monnaie on compte.
  */
  const orderOfItem = new Map<string, OrderRow>();

  for (const order of kept) {
    for (const item of order.items ?? []) {
      if (item?.id) orderOfItem.set(item.id, order);
    }
  }

  const itemIds = [...orderOfItem.keys()];

  let lines: CommissionLineRow[] = [];

  if (itemIds.length > 0) {
    const commission = req.scope.resolve("commission") as {
      listCommissionLines: (filters?: unknown, config?: unknown) => Promise<CommissionLineRow[]>;
    };

    lines = await commission.listCommissionLines({ item_id: itemIds });
  }

  const current: Record<string, Bucket> = {};
  const previous: Record<string, Bucket> = {};

  const countedOrders = new Set<string>();
  const countedPrevious = new Set<string>();

  const fromTime = from.getTime();

  for (const order of kept) {
    const when = new Date(order.created_at).getTime();

    if (Number.isNaN(when)) continue;

    const target = when >= fromTime ? current : previous;
    const seen = when >= fromTime ? countedOrders : countedPrevious;

    const currency = (order.currency_code ?? "").toUpperCase() || "—";

    const bucket = bucketOf(target, currency);

    bucket.volume += num(order.total);

    if (!seen.has(order.id)) {
      seen.add(order.id);
      bucket.orders += 1;
    }
  }

  /*
    Les commissions sur frais de port n'ont pas d'article : elles
    pointent une méthode d'expédition, qu'on ne sait pas rattacher à une
    devise par ce chemin. Elles sont comptées à part plutôt que
    réparties au hasard ou passées sous silence — un écart entre la
    somme affichée et la comptabilité doit pouvoir s'expliquer.
  */
  let unattributed = 0;

  for (const line of lines) {
    const amount = num(line.amount);

    if (!line.item_id) {
      unattributed += amount;
      continue;
    }

    const order = orderOfItem.get(line.item_id);

    if (!order) {
      unattributed += amount;
      continue;
    }

    const when = new Date(order.created_at).getTime();

    if (Number.isNaN(when)) continue;

    const target = when >= fromTime ? current : previous;

    const currency = (order.currency_code ?? "").toUpperCase() || "—";

    bucketOf(target, currency).commission += amount;
  }

  const sortByCommission = (a: Bucket, b: Bucket) => b.commission - a.commission;

  return res.json({
    period: { days, from: from.toISOString(), to: now.toISOString() },
    /*
      « dû » et non « encaissé ». MACHÉ ne perçoit pas les paiements ;
      ces montants restent à facturer aux vendeurs.
    */
    basis: "due",
    currencies: Object.values(current)
      .sort(sortByCommission)
      .map((bucket) => ({ ...bucket, effective_rate: effectiveRate(bucket) })),
    previous: Object.values(previous)
      .sort(sortByCommission)
      .map((bucket) => ({ ...bucket, effective_rate: effectiveRate(bucket) })),
    unattributed_commission: unattributed,
    /*
      Zéro abonnement, annoncé explicitement. Une clé absente se lirait
      comme un oubli ; une clé à zéro avec sa raison se lit comme un
      fait.
      */
    subscriptions: {
      amount: 0,
      note: "Les abonnements des marques ne sont pas encore facturés : rien n'est prélevé, donc rien n'est compté.",
    },
    orders_read: kept.length,
    truncated,
  });
}
