/*
  ROUTE : l'agent saisit le code de l'acheteur.

  C'est le seul chemin par lequel un colis devient « livré » du côté
  agent, et la seule chose qui rende ce statut crédible : l'agent ne
  connaît pas le code, il l'obtient de l'acheteur au moment où il lui
  remet le colis.

  Les règles de la saisie — plafond d'essais, statuts acceptés, passage
  du reversement à « reversable » — ne sont pas écrites ici. Elles
  vivent dans `delivery-confirm`, partagées avec la route du vendeur :
  c'est le même acte, il doit obéir aux mêmes règles, et deux copies
  auraient fini par diverger.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DELIVERY_MODULE } from "../../../../../../modules/delivery";
import { resolveAgent } from "../../../../../agent-context";
import { partyDelivery, customerId } from "../../../../../delivery-helpers";
import { confirmDelivery } from "../../../../../delivery-confirm";
import { agentDelivery } from "../route";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const me = customerId(req);

  if (!me) {
    return res.status(401).json({ message: "Connectez-vous à votre compte." });
  }

  const agent = await resolveAgent(req.scope, me);

  if (!agent) {
    return res.status(403).json({ message: "Ce compte n'a pas de fonction agent." });
  }

  if (agent.suspended) {
    return res.status(403).json({
      message: "Votre habilitation d'agent est suspendue. Contactez MACHÉ.",
    });
  }

  const delivery = await agentDelivery(req, me);

  if (!delivery) {
    return res.status(404).json({ message: "Colis introuvable." });
  }

  const service = req.scope.resolve(DELIVERY_MODULE) as Parameters<
    typeof confirmDelivery
  >[0];

  const outcome = await confirmDelivery(
    service,
    delivery,
    (req.body ?? {}) as { code?: unknown; note?: unknown },
    "agent"
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
