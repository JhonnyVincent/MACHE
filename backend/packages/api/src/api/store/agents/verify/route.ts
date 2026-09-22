/*
  ROUTE : vérifier qu'une personne est bien un agent MACHÉ.

  À quoi elle sert, concrètement

  Quelqu'un sonne. Il dit livrer une commande MACHÉ, ou tenir le point
  de relais du quartier. Le client va lui remettre de l'argent liquide —
  MACHÉ n'encaisse pas, le paiement se fait en main propre. Il a le
  droit de savoir à qui.

  C'est la route la plus sensible du site, et pas pour des raisons
  techniques : elle est consultée à l'instant où quelqu'un hésite sur le
  pas de sa porte.

  Ce qui fait foi, et ce qui ne fait pas foi

  L'appartenance à un GROUPE DE CLIENTS, que seule l'administration
  peut modifier. Pas le champ libre du client : un client écrit son
  propre champ libre — c'est là que vivent ses favoris — et pourrait
  donc s'y déclarer agent.

  Le code, lui, sert à désigner QUEL agent, pas à prouver qu'il en est
  un. Un faux agent qui inventerait un code ne serait dans aucun groupe,
  et la réponse serait « inconnu ».

  Ce qu'elle ne dit pas

  Ni adresse e-mail, ni nom complet, ni téléphone qui n'aurait pas été
  publié exprès. Quelqu'un qui essaierait des codes au hasard ne doit
  pas pouvoir constituer un annuaire des agents de MACHÉ. Le prénom et
  l'initiale suffisent à recouper avec la carte présentée.
*/

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/*
  Les groupes qui désignent un agent, et la fonction que chacun porte.
  Un client qui n'appartient à aucun d'eux n'est pas un agent, quoi que
  dise son champ libre.
*/
export const AGENT_GROUPS: Record<string, string> = {
  "mache-point-relais": "Point de relais",
  "mache-livreur": "Livreur",
  "mache-commercial": "Commercial",
};

type Raw = Record<string, unknown>;

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/*
  Le nom montré : prénom entier, initiale du nom. Assez pour recouper
  avec la carte présentée, pas assez pour constituer un annuaire.
*/
function publicName(customer: Raw): string {
  const first = str(customer.first_name) ?? "";
  const last = str(customer.last_name) ?? "";

  const initial = last ? `${last[0].toUpperCase()}.` : "";

  return [first, initial].filter(Boolean).join(" ") || "Agent MACHÉ";
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const code = str(req.query.code)?.toUpperCase();

  if (!code) {
    return res.status(400).json({ message: "Code manquant." });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  /*
    On part des GROUPES, pas des clients. Chercher parmi tous les
    clients ceux dont le champ libre porte ce code reviendrait à faire
    confiance à ce champ libre — et il est écrit par le client.
  */
  const { data: groups } = await query.graph({
    entity: "customer_group",
    fields: [
      "id",
      "name",
      "metadata",
      "customers.id",
      "customers.first_name",
      "customers.last_name",
      "customers.metadata",
    ],
  });

  for (const group of (groups ?? []) as Raw[]) {
    const slug = str((group.metadata as Raw)?.mache_agent_group);

    /* Un groupe qui n'est pas un groupe d'agents ne rend personne agent. */
    if (!slug || !AGENT_GROUPS[slug]) continue;

    for (const customer of ((group.customers as Raw[]) ?? [])) {
      const metadata = (customer.metadata as Raw) ?? {};

      if (str(metadata.agent_code)?.toUpperCase() !== code) continue;

      /*
        Trouvé. On ne rend que ce qu'un client a besoin de recouper, et
        le statut que MACHÉ a posé — jamais celui que l'agent
        déclarerait.
      */
      const suspended = metadata.agent_suspended === true;

      return res.json({
        found: true,
        display_name: publicName(customer),
        function: AGENT_GROUPS[slug],
        zone: str(metadata.agent_zone),
        /* Publié seulement si MACHÉ l'a renseigné exprès. */
        phone_public: str(metadata.agent_phone_public),
        /*
          Un agent suspendu existe toujours dans le groupe : le dire
          vaut mieux que de répondre « inconnu », qui ferait croire à
          une erreur de saisie et pousserait à réessayer.
        */
        trustworthy: !suspended,
        suspended,
      });
    }
  }

  /*
    Inconnu. La page distingue ce cas d'une panne : sur le pas d'une
    porte, « cette personne n'est pas un agent » et « MACHÉ n'en sait
    rien » appellent le même geste — ne rien remettre — mais pas la
    même accusation.
  */
  return res.json({ found: false });
}
