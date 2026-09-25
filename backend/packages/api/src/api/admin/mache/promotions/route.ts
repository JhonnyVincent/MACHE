/*
  ROUTE : les promotions, et qui les paie.

  Le problème qu'elle résout

  Mercur affiche déjà les promotions, mais rien n'y distingue celle
  qu'une boutique a créée de celle que MACHÉ offre. Ce sont pourtant
  deux choses opposées :

  - la promotion d'une BOUTIQUE sort de la poche du vendeur ; MACHÉ
    garde sa commission entière et n'y perd rien ;
  - la promotion de MACHÉ sort de la commission de MACHÉ ; le vendeur
    touche ce qu'il aurait touché sans elle.

  Sur le même écran, sans étiquette, les deux se ressemblent — et c'est
  exactement le moment où l'on accorde sans le savoir une remise qu'on
  finance soi-même.

  COMMENT ON RECONNAÎT L'UNE DE L'AUTRE

  Une promotion liée à un vendeur lui appartient. Une promotion sans
  vendeur est celle de MACHÉ. C'est le lien que Mercur pose déjà quand
  un vendeur crée une promotion depuis son tableau de bord.

  Le PORTEUR du coût est une donnée distincte (`promotion_cost`), et
  c'est elle qui décide réellement. Une promotion de MACHÉ dont
  personne n'a déclaré le porteur reste à la charge du vendeur — c'est
  le défaut prudent, et l'écran le dit au lieu de le laisser deviner.

  CE QUE « COÛT » VEUT DIRE ICI

  Ce que MACHÉ a déjà déboursé, lu sur les lignes de commission
  réellement enregistrées. Pas une projection : de l'argent
  effectivement retiré de la commission, commande par commande.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { marketplaceShare } from "../../../../modules/commission-mache/funding";

/*
  Plafond de lecture. Une place de marché n'a pas des milliers de
  promotions ; si elle en arrive là, cet écran n'est plus le bon outil
  et la réponse le signale au lieu de tronquer en silence.
*/
const MAX_PROMOTIONS = 500;

type CostRow = {
  promotion_id: string;
  cost_bearer: string;
  shared_marketplace_percentage?: number | null;
};

type PromotionRow = {
  id: string;
  code: string | null;
  status: string | null;
  is_automatic: boolean | null;
  type: string | null;
  created_at?: string | null;
  campaign?: { id: string; name: string | null } | null;
  application_method?: {
    type: string | null;
    value: number | string | null;
    currency_code: string | null;
    target_type: string | null;
    allocation: string | null;
  } | null;
  seller?: { id: string; name: string | null; handle: string | null } | null;
  promotion_cost?: CostRow | null;
};

type CommissionLineRow = {
  amount: number | string | null;
  data: Record<string, unknown> | null;
};

function num(value: number | string | null | undefined): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

/*
  La phrase que lit le dirigeant. Elle nomme qui paie, et à quelle
  hauteur — parce que « partagé 25 % » et « partagé 75 % » n'engagent
  pas du tout la même somme.
*/
function whoPays(cost: CostRow | null | undefined, share: number): string {
  if (!cost) {
    return "Le vendeur — aucun porteur n'a été déclaré pour cette promotion.";
  }

  if (cost.cost_bearer === "marketplace") {
    return "MACHÉ — la remise entière est retirée de la commission.";
  }

  if (cost.cost_bearer === "shared") {
    if (share <= 0) {
      return "Le vendeur — la promotion est déclarée partagée, mais sans pourcentage, donc MACHÉ n'en porte rien.";
    }

    return `Partagé — MACHÉ porte ${Math.round(share * 100)} % de la remise, le vendeur le reste.`;
  }

  return "Le vendeur — la remise sort de son chiffre d'affaires, celui de MACHÉ n'est pas touché.";
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: promotions } = await query.graph({
    entity: "promotion",
    fields: [
      "id",
      "code",
      "status",
      "is_automatic",
      "type",
      "created_at",
      "campaign.id",
      "campaign.name",
      "application_method.type",
      "application_method.value",
      "application_method.currency_code",
      "application_method.target_type",
      "application_method.allocation",
      "seller.id",
      "seller.name",
      "seller.handle",
      "promotion_cost.promotion_id",
      "promotion_cost.cost_bearer",
      "promotion_cost.shared_marketplace_percentage",
    ],
  });

  /*
    `query.graph` est typé avec le modèle complet d'une promotion, alors
    que la requête n'en demande qu'une partie. Le passage par `unknown`
    dit que ce qui revient est la forme demandée juste au-dessus.
  */
  const rows = (promotions as unknown as PromotionRow[]) ?? [];

  const truncated = rows.length > MAX_PROMOTIONS;
  const kept = rows.slice(0, MAX_PROMOTIONS);

  /*
    Ce que chaque promotion a déjà coûté à MACHÉ. Les lignes de
    commission portent la ventilation écrite par le fournisseur au
    moment du calcul ; on la relit plutôt que de la recalculer, pour la
    même raison qu'ailleurs : les taux et les porteurs ont pu changer
    depuis, et rejouer le calcul d'aujourd'hui sur des commandes
    d'hier donnerait un chiffre faux.
  */
  const spent: Record<string, number> = {};

  const commission = req.scope.resolve("commission") as {
    listCommissionLines: (filters?: unknown, config?: unknown) => Promise<CommissionLineRow[]>;
  };

  const lines = await commission.listCommissionLines({});

  for (const line of lines) {
    const breakdown = line.data?.mache_funded_by_promotion;

    if (!breakdown || typeof breakdown !== "object") continue;

    for (const [promotionId, amount] of Object.entries(
      breakdown as Record<string, unknown>
    )) {
      spent[promotionId] = (spent[promotionId] ?? 0) + num(amount as number);
    }
  }

  const items = kept.map((promotion) => {
    const cost = promotion.promotion_cost ?? null;
    const share = marketplaceShare(cost);

    return {
      id: promotion.id,
      code: promotion.code,
      status: promotion.status,
      is_automatic: promotion.is_automatic,
      type: promotion.type,
      created_at: promotion.created_at ?? null,
      campaign: promotion.campaign ?? null,
      application_method: promotion.application_method ?? null,
      /* Null = c'est une promotion de MACHÉ, pas celle d'une boutique. */
      seller: promotion.seller ?? null,
      owner: promotion.seller ? "seller" : "mache",
      cost_bearer: cost?.cost_bearer ?? null,
      shared_marketplace_percentage: cost?.shared_marketplace_percentage ?? null,
      /* La part réellement portée par MACHÉ, entre 0 et 1. */
      mache_share: share,
      who_pays: whoPays(cost, share),
      /* Déjà déboursé par MACHÉ sur cette promotion, toutes commandes confondues. */
      mache_spent: spent[promotion.id] ?? 0,
    };
  });

  return res.json({
    promotions: items,
    count: items.length,
    truncated,
  });
}
