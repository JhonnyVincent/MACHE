/*
  Répondre à une question : ce client connecté est-il un agent MACHÉ,
  et lequel ?

  D'où vient la réponse

  Des GROUPES DE CLIENTS, que seule l'administration modifie. Pas du
  champ libre du client : ce champ, le client l'écrit lui-même — c'est
  là que vivent ses favoris — et quiconque pourrait s'y déclarer
  livreur.

  C'est la même règle que la vérification publique par code, et ce
  n'est pas un hasard : si les deux ne s'accordaient pas, un client
  pourrait se voir refuser la carte que la page publique lui reconnaît,
  ou l'inverse.

  Le champ libre reste lu pour ce qui n'habilite à rien — le code de la
  carte, la zone.

  LA SUSPENSION AUSSI VIENT D'UN GROUPE

  Elle a vécu dans le champ libre, et c'était une faille : ce champ est
  écrit par le client, et la route publique accepte n'importe quelle
  clé. Un agent suspendu n'avait qu'à s'écrire « non suspendu » pour
  recommencer à confirmer des livraisons.

  Le champ libre est encore LU, mais il ne peut plus que SUSPENDRE, et
  jamais lever une suspension. Un agent suspendu à l'ancienne le reste
  donc, et un agent qui s'écrirait « non suspendu » n'y gagne rien.
*/

import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { AGENT_GROUPS, SUSPENDED_MARKER } from "./agent-identity";

type Raw = Record<string, unknown>;

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export type AgentContext = {
  customer_id: string;
  /* `mache-livreur`, `mache-point-relais`, `mache-commercial`. */
  slug: string;
  /* Le libellé lisible de la fonction. */
  function: string;
  code: string | null;
  zone: string | null;
  suspended: boolean;
};

/*
  `null` veut dire « pas un agent ». Un agent SUSPENDU n'est pas `null` :
  il est renvoyé avec `suspended: true`, pour que les routes lui
  répondent « votre habilitation est suspendue » plutôt que « vous
  n'êtes pas agent ». Les deux phrases n'appellent pas le même geste —
  la première se règle en appelant MACHÉ, la seconde laisse croire à
  une erreur de compte.
*/
export async function resolveAgent(
  scope: { resolve: (key: string) => unknown },
  customerId: string | null
): Promise<AgentContext | null> {
  if (!customerId) return null;

  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: unknown) => Promise<{ data: unknown }>;
  };

  const { data: groups } = await query.graph({
    entity: "customer_group",
    fields: ["id", "metadata", "customers.id", "customers.metadata"],
  });

  const rows = (groups ?? []) as Raw[];

  /*
    La suspension se lit AVANT la fonction : les deux appartenances sont
    indépendantes, et l'ordre des groupes n'est pas garanti. La chercher
    en chemin ferait dépendre le résultat de cet ordre — un agent
    suspendu passerait pour actif un jour sur deux.
  */
  const suspendedByGroup = rows.some((group) => {
    if ((group.metadata as Raw)?.[SUSPENDED_MARKER] !== true) return false;

    return (((group.customers as Raw[]) ?? [])).some(
      (customer) => customer.id === customerId
    );
  });

  for (const group of rows) {
    const slug = str((group.metadata as Raw)?.mache_agent_group);

    if (!slug || !AGENT_GROUPS[slug]) continue;

    for (const customer of (((group.customers as Raw[]) ?? []))) {
      if (customer.id !== customerId) continue;

      const metadata = (customer.metadata as Raw) ?? {};

      return {
        customer_id: customerId,
        slug,
        function: AGENT_GROUPS[slug],
        code: str(metadata.agent_code),
        zone: str(metadata.agent_zone),
        /*
          Le OU est le point entier. Le champ libre, écrit par le
          client, ne peut que RENFORCER la suspension, jamais la lever.
        */
        suspended: suspendedByGroup || metadata.agent_suspended === true,
      };
    }
  }

  return null;
}
