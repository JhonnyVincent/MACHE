/*
  Confronter un panier aux commandes minimums de ses boutiques.

  Le panier connaît ses lignes et leurs boutiques ; les minimums vivent
  dans le champ libre de chaque vendeur. Ce module fait la jonction, et
  c'est le seul endroit où elle se fait : le panier et le passage en
  caisse doivent répondre la même chose, sinon on laisse passer à la
  caisse ce que le panier annonçait comme bloqué.
*/

import { fetchSellers } from "./catalog";
import {
  groupBySeller,
  readSellerMinimum,
  type SellerGroup,
} from "@/lib/seller-minimum";
import type { Cart } from "./cart";

export type { SellerGroup };

/*
  Les boutiques du panier, avec leur total et ce qui leur manque.

  Quand les boutiques ne peuvent pas être lues, on renvoie des groupes
  SANS minimum plutôt qu'aucun groupe : une panne de lecture ne doit pas
  bloquer une commande qui respectait peut-être toutes les conditions.
  Le risque assumé est l'inverse — laisser passer une commande sous le
  minimum d'un vendeur — et il est le moindre des deux : le vendeur peut
  refuser, un client bloqué sans raison s'en va.
*/
export async function sellerGroupsOf(cart: Cart): Promise<SellerGroup[]> {
  if (cart.lines.length === 0) return [];

  const minimums = new Map<string, number>();

  const sellers = await fetchSellers(100);

  if (sellers.ok) {
    for (const seller of sellers.data.sellers) {
      const minimum = readSellerMinimum(seller.metadata);

      if (minimum > 0) minimums.set(seller.id, minimum);
    }
  }

  return groupBySeller(cart.lines, minimums);
}
