/*
  SCRIPT : les groupes d'agents MACHÉ.

  Qui sont les agents

  Ce ne sont PAS des administrateurs. Ce sont des clients de MACHÉ —
  ils achètent comme tout le monde — à qui s'ajoute une fonction :
  tenir un point de relais, livrer, ou démarcher des commerçants. Des
  gens de plus pour que MACHÉ tourne.

  Ils s'authentifient donc comme des clients, avec un compte client.

  Pourquoi des GROUPES et pas le champ libre du client

  Parce qu'un client écrit son propre champ libre : c'est là que vivent
  ses favoris. S'y déclarer agent serait à la portée de n'importe qui,
  et la page de vérification publique — celle qu'on consulte avant de
  remettre de l'argent liquide à un inconnu — ne vaudrait plus rien.

  L'appartenance à un groupe, elle, ne se modifie que depuis
  l'administration. C'est ce qui fait foi.

  Le champ libre reste utile pour ce qui n'engage personne : le code de
  la carte, la zone, un téléphone publié exprès. Un agent qui
  modifierait son propre code ne romprait que sa propre vérification.
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

const GROUPS = [
  { slug: "mache-point-relais", name: "MACHÉ — Points de relais" },
  { slug: "mache-livreur", name: "MACHÉ — Livreurs" },
  { slug: "mache-commercial", name: "MACHÉ — Commerciaux" },
];

export default async function agentGroups({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { createCustomerGroupsWorkflow } = await import(
    "@medusajs/core-flows"
  );

  const { data: existing } = await query.graph({
    entity: "customer_group",
    fields: ["id", "name", "metadata"],
  });

  const known = new Set(
    ((existing ?? []) as { metadata?: Record<string, unknown> }[])
      .map((group) => group.metadata?.mache_agent_group)
      .filter((slug): slug is string => typeof slug === "string")
  );

  const missing = GROUPS.filter((group) => !known.has(group.slug));

  if (missing.length === 0) {
    logger.info("Groupes d'agents MACHÉ déjà en place. Inchangés.");
    return;
  }

  await createCustomerGroupsWorkflow(container).run({
    input: {
      customersData: missing.map((group) => ({
        name: group.name,
        /*
          L'étiquette qui dit « ce groupe désigne des agents », et
          laquelle des trois fonctions. Le NOM du groupe ne sert pas à
          cela : il se renomme depuis le panneau, et la vérification
          publique s'arrêterait sans que personne ne comprenne
          pourquoi.
        */
        metadata: { mache_agent_group: group.slug },
      })),
    },
  });

  for (const group of missing) {
    logger.info(`Groupe d'agents créé : ${group.name}`);
  }

  logger.info(
    "Pour faire d'un client un agent : ajoutez-le au groupe depuis le panneau d'administration, puis renseignez agent_code et agent_zone dans son champ libre."
  );
}
