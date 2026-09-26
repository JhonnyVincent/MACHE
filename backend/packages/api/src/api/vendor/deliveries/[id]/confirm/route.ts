/*
  ROUTE : le vendeur qui a livré lui-même saisit le code de l'acheteur.

  C'est le cas que vise tout le module. Le vendeur porte le colis, il
  n'y a ni agent ni transporteur, personne d'autre n'était là. Sans
  code, « livré » ne serait que la parole du vendeur — et c'est sur
  cette parole qu'il faudrait le payer.

  Les règles sont celles de `delivery-confirm`, partagées avec la route
  de l'agent : même acte, mêmes règles. C'est là aussi que le
  reversement passe à « reversable ».
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { partyDelivery } from "../../../../delivery-helpers";
import { confirmDelivery } from "../../../../delivery-confirm";
import { sellerDelivery } from "../route";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const delivery = await sellerDelivery(req);

  if (!delivery) {
    return res.status(404).json({ message: "Livraison introuvable." });
  }

  const outcome = await confirmDelivery(
    req.scope,
    delivery,
    (req.body ?? {}) as { code?: unknown; note?: unknown },
    "seller"
  );

  if (!outcome.ok) {
    return res.status(outcome.status).json({
      message: outcome.message,
      ...(outcome.attempts_left === undefined
        ? {}
        : { attempts_left: outcome.attempts_left }),
    });
  }

  return res.json({ delivery: partyDelivery(outcome.delivery) });
}
