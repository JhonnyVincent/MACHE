/*
  LE BLOCAGE D'UN COMPTE CLIENT.

  CE QU'IL FAIT

  Il empêche CE COMPTE d'agir : commander en étant connecté, déposer un
  avis, ouvrir une conversation, se servir de l'espace agent. Toute
  requête d'écriture faite avec sa session est refusée.

  CE QU'IL NE FAIT PAS, ET C'EST DIT PARTOUT

  Il n'empêche pas la PERSONNE de revenir. On peut acheter sur MACHÉ
  sans compte, et rien n'interdit d'en créer un autre avec une autre
  adresse. Prétendre le contraire serait promettre une barrière qui
  n'existe pas, à l'endroit précis où l'on croit s'être protégé.

  POURQUOI UN GROUPE DE CLIENTS

  Parce qu'une appartenance à un groupe ne se modifie que depuis
  l'administration. Le champ libre du client, lui, est écrit par le
  client — c'est la faille qui avait été trouvée sur la suspension des
  agents, et il n'y a aucune raison de la reproduire ici.

  POURQUOI IL LAISSE PASSER EN CAS DE PANNE

  Si la lecture des groupes échoue, la requête PASSE. C'est un choix,
  et il mérite d'être défendu : ce contrôle est une mesure de
  modération, pas une frontière de sécurité. Le fermer en cas de panne
  arrêterait les commandes de TOUS les clients parce qu'une requête a
  échoué — un incident bien plus grave que le passage d'un compte
  bloqué pendant quelques minutes.

  La lecture se fait par identifiant de client, pas en parcourant tous
  les groupes : c'est une requête indexée, et elle s'exécute sur chaque
  écriture d'un client connecté.
*/

import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BLOCKED_MARKER } from "./agent-identity";

type Raw = Record<string, unknown>;

export const BLOCKED_MESSAGE =
  "Ce compte a été bloqué par MACHÉ. Écrivez-nous si vous pensez qu'il s'agit d'une erreur.";

/*
  L'identifiant du client connecté, ou `null`.

  Un panier d'invité n'a pas de session client : il n'y a alors rien à
  vérifier, et la requête passe sans la moindre lecture.
*/
function customerId(req: MedusaRequest): string | null {
  const context = (req as { auth_context?: { actor_id?: string; actor_type?: string } })
    .auth_context;

  if (!context || context.actor_type !== "customer") return null;

  return typeof context.actor_id === "string" && context.actor_id
    ? context.actor_id
    : null;
}

export async function isBlocked(
  scope: { resolve: (key: string) => unknown },
  id: string
): Promise<boolean> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: unknown) => Promise<{ data: unknown }>;
  };

  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "groups.metadata"],
    filters: { id },
  });

  const [customer] = (data ?? []) as Raw[];

  if (!customer) return false;

  return (((customer.groups as Raw[]) ?? [])).some(
    (group) => (group?.metadata as Raw)?.[BLOCKED_MARKER] === true
  );
}

export async function refuseBlockedCustomer(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const id = customerId(req);

  /* Invité, ou requête non authentifiée : rien à vérifier. */
  if (!id) return next();

  try {
    if (await isBlocked(req.scope, id)) {
      return res.status(403).json({ message: BLOCKED_MESSAGE });
    }
  } catch {
    /*
      Laisser passer. Voir l'en-tête : refuser ici arrêterait les
      commandes de tous les clients à cause d'une lecture qui a échoué.
    */
    return next();
  }

  return next();
}
