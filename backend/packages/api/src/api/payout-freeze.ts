/*
  LE GEL DES VERSEMENTS D'UNE BOUTIQUE.

  Ce fichier répond à une seule question — « l'argent de cette boutique
  est-il retenu ? » — et il est le SEUL endroit qui y réponde. Deux
  routes différentes libèrent des versements ; si chacune décidait dans
  son coin, l'une d'elles finirait par oublier le gel, et ce serait
  celle-là que la fraude emprunterait.

  CE QUE LE GEL FAIT, ET CE QU'IL NE FAIT PAS

  MACHÉ n'encaisse pas : l'acheteur règle le vendeur en main propre.
  Geler ne reprend donc rien à un vendeur qui a déjà l'argent, et aucun
  écran ne doit le laisser croire.

  Ce qui est réel aujourd'hui : une livraison confirmée reste
  confirmée — la remise a eu lieu, c'est un fait — mais son
  `payout_state` reste « held » au lieu de passer à « releasable ». La
  somme n'est pas portée comme due au vendeur. Le jour où MACHÉ versera
  vraiment, c'est la même vanne, déjà fermée.

  POURQUOI LE GEL N'EMPÊCHE PAS DE CONFIRMER LA LIVRAISON

  Parce que la livraison est un FAIT et le versement une DÉCISION.
  Refuser la confirmation ferait perdre le fait — on ne saurait plus si
  le colis est arrivé — et punirait l'acheteur, qui n'y est pour rien,
  en le laissant avec un colis reçu que le site dit en route. On
  enregistre donc la remise, et on retient l'argent.

  EN CAS DE PANNE, ON RETIENT

  Si la lecture échoue, on considère la boutique COMME GELÉE. C'est
  l'inverse du choix fait pour les comptes bloqués, et pour une raison
  précise : là-bas, se fermer sur incident aurait arrêté les commandes
  de tous les clients. Ici, se fermer laisse simplement une somme en
  attente une heure de plus, ce qui se rattrape — alors qu'un versement
  libéré à tort pendant une fraude ne se rattrape pas.
*/

import { DELIVERY_MODULE } from "../modules/delivery";

type FreezeRow = { id: string; seller_id: string; active: boolean };

type Service = {
  listPayoutFreezes: (filters?: unknown, config?: unknown) => Promise<FreezeRow[]>;
};

/*
  Le `payout_state` à écrire pour une livraison qu'on vient de
  confirmer : « releasable » normalement, « held » si la boutique est
  gelée.

  Rendre l'état plutôt qu'un booléen force l'appelant à s'en servir :
  un booléen ignoré se lit comme du code mort, un état qu'on écrit
  quelque part se remarque.
*/
export async function payoutStateAfterConfirmation(
  scope: { resolve: (key: string) => unknown },
  sellerId: string | null | undefined
): Promise<"releasable" | "held"> {
  if (!sellerId) return "releasable";

  try {
    const service = scope.resolve(DELIVERY_MODULE) as Service;

    const [freeze] = await service.listPayoutFreezes(
      { seller_id: sellerId, active: true },
      { take: 1 }
    );

    return freeze ? "held" : "releasable";
  } catch {
    /* Voir l'en-tête : en cas de panne, on retient. */
    return "held";
  }
}

/* Cette boutique est-elle gelée ? Pour les écrans, pas pour décider. */
export async function isSellerFrozen(
  scope: { resolve: (key: string) => unknown },
  sellerId: string
): Promise<boolean> {
  return (await payoutStateAfterConfirmation(scope, sellerId)) === "held";
}
