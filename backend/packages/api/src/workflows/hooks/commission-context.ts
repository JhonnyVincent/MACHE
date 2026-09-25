/*
  HOOK : dire au calcul de commission ce que MACHÉ finance.

  Pourquoi un hook

  Le contexte de calcul de Mercur transporte les montants d'un article
  — sous-total, taxe, total — mais PAS les promotions qui lui ont été
  appliquées. Le fournisseur de commission ne peut donc pas savoir
  qu'une remise existe, encore moins qui la porte.

  Mercur prévoit exactement ce cas : `additional_context`, un champ
  laissé libre et rempli par ce hook, « pour les données que les champs
  du cadre ne portent pas ». On l'utilise pour ce à quoi il sert au
  lieu de contourner quoi que ce soit.

  CE QUE CE HOOK CALCULE

  Pour chaque article : la part de sa remise que MACHÉ a décidé de
  porter. Elle vient de `promotion_cost`, un modèle que Mercur possède
  déjà — `cost_bearer` valant `store`, `marketplace` ou `shared`, avec
  un pourcentage pour ce dernier.

  Ce modèle existait sans que rien ne le lise : la promotion pouvait
  être déclarée « à la charge de la marketplace », le vendeur la payait
  quand même. Ce hook est le chaînon qui manquait.

  PAR DÉFAUT, MACHÉ NE FINANCE RIEN

  Une promotion sans coût déclaré est traitée comme étant à la charge
  du vendeur. C'est le comportement actuel, et c'est le seul défaut
  prudent : supposer l'inverse ferait payer MACHÉ pour des promotions
  que les vendeurs créent eux-mêmes, sans que personne ne l'ait décidé.
*/

import { refreshOrderCommissionLinesWorkflow } from "@mercurjs/core/workflows";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { StepResponse } from "@medusajs/framework/workflows-sdk";
import type { CommissionCalculationContext } from "@mercurjs/types";
import { MACHE_FUNDING_KEY } from "../../modules/commission-mache";
import {
  fundedForItem,
  type Adjustment,
  type CostRow,
  type ItemFunding,
} from "../../modules/commission-mache/funding";

type OrderRow = {
  id: string;
  items?: { id: string; adjustments?: Adjustment[] | null }[] | null;
};

refreshOrderCommissionLinesWorkflow.hooks.setCommissionContext(
  async ({ contexts }, { container }) => {
    const list: CommissionCalculationContext[] = contexts ?? [];

    /*
      Le hook doit rendre une réponse d'étape, pas le tableau nu : le
      cadre s'en sert pour savoir s'il doit remplacer le contexte, et
      un tableau brut serait refusé à la compilation.
    */
    if (list.length === 0) return new StepResponse(list);

    const orderIds = [
      ...new Set(
        list
          .map((context) => context.order_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      ),
    ];

    if (orderIds.length === 0) return new StepResponse(list);

    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "items.id",
        "items.adjustments.amount",
        "items.adjustments.promotion_id",
      ],
      filters: { id: orderIds },
    });

    const rows = (orders as unknown as OrderRow[]) ?? [];

    /* Les promotions réellement appliquées. Inutile de charger les autres. */
    const promotionIds = [
      ...new Set(
        rows
          .flatMap((order) => order.items ?? [])
          .flatMap((item) => item.adjustments ?? [])
          .map((adjustment) => adjustment?.promotion_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      ),
    ];

    const costs = new Map<string, CostRow>();

    if (promotionIds.length > 0) {
      /*
        Une lecture qui échoue ne doit pas bloquer une commande. On
        retombe alors sur « rien n'est financé par MACHÉ » — le
        comportement actuel, prudent : le vendeur n'est pas lésé, et
        MACHÉ ne débourse pas sur la foi d'une donnée qu'on n'a pas pu
        lire.
      */
      try {
        const service = container.resolve("promotion_cost") as {
          listPromotionCosts: (filters?: unknown) => Promise<CostRow[]>;
        };

        const found = await service.listPromotionCosts({
          promotion_id: promotionIds,
        });

        for (const cost of found ?? []) {
          costs.set(cost.promotion_id, cost);
        }
      } catch {
        costs.clear();
      }
    }

    /* Ce que MACHÉ porte, article par article. */
    const fundedByItem = new Map<string, ItemFunding>();

    for (const order of rows) {
      for (const item of order.items ?? []) {
        const funding = fundedForItem(item.adjustments, costs);

        if (funding.total > 0) fundedByItem.set(item.id, funding);
      }
    }

    if (fundedByItem.size === 0) return new StepResponse(list);

    /*
      Le champ libre est fusionné, pas remplacé : un autre hook a pu y
      déposer quelque chose, et l'écraser pour y ajouter une clé serait
      une perte de données au nom d'une promotion.
    */
    const enriched = list.map((context) => {
      const funded: Record<string, ItemFunding> = {};

      for (const item of context.items ?? []) {
        const funding = fundedByItem.get(item.id);

        if (funding) funded[item.id] = funding;
      }

      if (Object.keys(funded).length === 0) return context;

      return {
        ...context,
        additional_context: {
          ...(context.additional_context ?? {}),
          [MACHE_FUNDING_KEY]: funded,
        },
      };
    });

    return new StepResponse(enriched);
  }
);
