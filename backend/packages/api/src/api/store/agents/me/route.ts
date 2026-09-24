/*
  ROUTE : « suis-je un agent, et lequel ? »

  Elle est sous /store et non sous /admin, et c'est le point important :
  un agent MACHÉ n'est pas un administrateur. C'est un client — il
  achète comme tout le monde — à qui s'ajoute une fonction. Il se
  connecte donc avec son compte client, et l'espace agent est un écran
  de plus dans ce compte, pas une porte dérobée vers l'administration.

  Ce que la réponse permet à l'interface de dire

  - pas connecté : « connectez-vous » ;
  - connecté sans être agent : « ce compte n'a pas de fonction agent » ;
  - agent suspendu : « votre habilitation est suspendue » ;
  - agent : sa fonction et sa zone.

  Ces quatre cas appellent quatre phrases différentes. Les fondre en
  « accès refusé » enverrait un agent suspendu vérifier son mot de passe.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { resolveAgent } from "../../../agent-context";
import { customerId } from "../../../delivery-helpers";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const me = customerId(req);

  if (!me) {
    return res.status(401).json({ message: "Connectez-vous à votre compte." });
  }

  const agent = await resolveAgent(req.scope, me);

  if (!agent) {
    return res.json({ agent: null });
  }

  return res.json({
    agent: {
      customer_id: agent.customer_id,
      function: agent.function,
      slug: agent.slug,
      code: agent.code,
      zone: agent.zone,
      suspended: agent.suspended,
    },
  });
}
