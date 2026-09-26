/*
  ROUTE : geler et dégeler les versements d'une boutique.

  POURQUOI CE N'EST PAS LA SUSPENSION

  Suspendre arrête la VENTE. Geler arrête l'ARGENT. On veut souvent
  l'un sans l'autre : laisser une boutique honorer les commandes déjà
  passées tout en retenant les sommes le temps de vérifier, ou fermer
  une boutique dont les versements sont déjà réglés. Les fondre en un
  seul bouton obligerait à choisir entre ne rien faire et tout casser.

  CE QUE LE GEL FAIT VRAIMENT

  MACHÉ n'encaisse pas : l'acheteur règle le vendeur en main propre.
  Geler ne reprend donc rien à un vendeur qui a déjà l'argent, et la
  réponse le dit pour que l'écran puisse le répéter.

  Ce qui est réel : une livraison confirmée cesse de porter sa somme
  comme due au vendeur — `payout_state` reste « held ». Le jour où
  MACHÉ versera, c'est la même vanne, déjà fermée.

  LE MOTIF EST OBLIGATOIRE

  Un gel sans motif est une accusation que personne ne sait plus
  justifier six mois plus tard, ni défendre si le vendeur la conteste,
  ni lever si celui qui l'a posée est parti.

  ON NE SUPPRIME PAS UN GEL LEVÉ

  Il a retenu de l'argent pendant un temps. L'effacer rendrait
  inexplicable un écart constaté après coup. Il est désactivé, avec son
  motif de levée.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DELIVERY_MODULE } from "../../../../modules/delivery";
import { text, MAX_NOTE, MAX_SHORT } from "../../../delivery-helpers";

type FreezeRow = {
  id: string;
  seller_id: string;
  reason: string;
  frozen_by: string | null;
  active: boolean;
  lifted_by: string | null;
  lifted_reason: string | null;
  lifted_at: Date | string | null;
  created_at?: Date | string | null;
};

type DeliveryRow = {
  id: string;
  seller_id: string;
  payout_state: string;
};

type Service = {
  listPayoutFreezes: (filters?: unknown, config?: unknown) => Promise<FreezeRow[]>;
  createPayoutFreezes: (data: Record<string, unknown>) => Promise<FreezeRow>;
  updatePayoutFreezes: (data: Record<string, unknown>) => Promise<FreezeRow>;
  listDeliveries: (filters?: unknown, config?: unknown) => Promise<DeliveryRow[]>;
  updateDeliveries: (data: Record<string, unknown>) => Promise<unknown>;
};

function when(value: Date | string | null | undefined): string | null {
  if (!value) return null;

  return value instanceof Date ? value.toISOString() : value;
}

function shape(freeze: FreezeRow, held: number) {
  return {
    id: freeze.id,
    seller_id: freeze.seller_id,
    reason: freeze.reason,
    frozen_by: freeze.frozen_by,
    active: freeze.active,
    lifted_by: freeze.lifted_by,
    lifted_reason: freeze.lifted_reason,
    lifted_at: when(freeze.lifted_at),
    created_at: when(freeze.created_at),
    /*
      Combien de livraisons de cette boutique sont retenues. C'est la
      seule mesure honnête de ce que le gel bloque : MACHÉ ne connaît
      pas les montants, il ne les encaisse pas.
    */
    deliveries_held: held,
  };
}

/* Qui décide. Un gel est une mesure grave ; on retient qui l'a posée. */
function actor(req: MedusaRequest): string | null {
  const auth = (req as { auth_context?: { actor_id?: string } }).auth_context;

  return typeof auth?.actor_id === "string" ? auth.actor_id : null;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  const freezes = await service.listPayoutFreezes(
    {},
    { order: { created_at: "DESC" } }
  );

  /*
    Les livraisons retenues, comptées par boutique en une seule
    lecture. Une lecture par gel ferait autant d'allers-retours qu'il y
    a de boutiques gelées, sur un écran qu'on ouvre justement quand il
    y en a plusieurs.
  */
  const sellerIds = [...new Set(freezes.map((freeze) => freeze.seller_id))];

  const heldBySeller = new Map<string, number>();

  if (sellerIds.length > 0) {
    const held = await service.listDeliveries({
      seller_id: sellerIds,
      payout_state: "held",
    });

    for (const delivery of held) {
      heldBySeller.set(
        delivery.seller_id,
        (heldBySeller.get(delivery.seller_id) ?? 0) + 1
      );
    }
  }

  return res.json({
    freezes: freezes.map((freeze) =>
      shape(freeze, heldBySeller.get(freeze.seller_id) ?? 0)
    ),
    /*
      Dit une fois, pour que l'écran n'ait pas à l'inventer : MACHÉ
      n'encaisse pas, donc le gel retient ce qui reste à verser et ne
      reprend pas ce qui est déjà encaissé.
    */
    note: "MACHÉ n'encaisse pas les paiements : l'acheteur règle le vendeur en main propre. Un gel retient ce qui reste à porter comme dû ; il ne reprend pas l'argent déjà remis au vendeur.",
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const sellerId = text(body.seller_id, MAX_SHORT);
  const action = typeof body.action === "string" ? body.action : "freeze";

  if (!sellerId) {
    return res.status(400).json({ message: "Boutique manquante." });
  }

  const service = req.scope.resolve(DELIVERY_MODULE) as Service;

  const [existing] = await service.listPayoutFreezes(
    { seller_id: sellerId, active: true },
    { take: 1 }
  );

  if (action === "lift") {
    if (!existing) {
      return res.status(409).json({
        message: "Les versements de cette boutique ne sont pas gelés.",
      });
    }

    const reason = text(body.reason, MAX_NOTE);

    if (!reason) {
      return res.status(400).json({
        message:
          "Dites pourquoi vous levez le gel. Un dégel sans motif est une décision que personne ne saura expliquer si l'argent repart et que la fraude était réelle.",
      });
    }

    const lifted = await service.updatePayoutFreezes({
      id: existing.id,
      active: false,
      lifted_by: actor(req),
      lifted_reason: reason,
      lifted_at: new Date(),
    });

    return res.json({ freeze: shape(lifted, 0), lifted: true });
  }

  if (existing) {
    return res.status(409).json({
      message: "Les versements de cette boutique sont déjà gelés.",
      freeze: shape(existing, 0),
    });
  }

  const reason = text(body.reason, MAX_NOTE);

  if (!reason) {
    return res.status(400).json({
      message:
        "Dites ce que vous reprochez à cette boutique. Un gel sans motif ne pourra ni être défendu s'il est contesté, ni levé par quelqu'un d'autre.",
    });
  }

  const created = await service.createPayoutFreezes({
    seller_id: sellerId,
    reason,
    frozen_by: actor(req),
    active: true,
  });

  /*
    Les livraisons DÉJÀ marquées « à verser » repassent en retenue.

    Sans cela, geler n'agirait que sur l'avenir — et la fraude qu'on
    vient de constater porte précisément sur des livraisons déjà
    confirmées. Le gel n'attraperait rien de ce qui l'a motivé.
  */
  const releasable = await service.listDeliveries({
    seller_id: sellerId,
    payout_state: "releasable",
  });

  for (const delivery of releasable) {
    await service.updateDeliveries({ id: delivery.id, payout_state: "held" });
  }

  return res.status(201).json({
    freeze: shape(created, releasable.length),
    /* Combien de versements déjà autorisés viennent d'être repris. */
    pulled_back: releasable.length,
  });
}
