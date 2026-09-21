/*
  La commande minimum d'une boutique.

  À quoi cela sert

  Un grossiste ne vend pas à l'unité. « Minimum 5 000 HTG » est une
  condition de vente ordinaire dans le commerce de gros, et MACHÉ
  annonce des boutiques fournisseurs depuis sa page d'accueil sans
  qu'aucune puisse l'exprimer.

  Où c'est rangé

  Dans le champ libre du vendeur, sous `min_order`, en gourdes — la
  devise de la région Haïti, celle dans laquelle les paniers sont
  calculés.

  Une limite, dite franchement : si MACHÉ ouvre un jour une seconde
  région dans une autre devise, ce nombre ne voudra plus dire la même
  chose selon qui regarde. Le jour venu, il faudra un montant par
  devise. Aujourd'hui il n'y a qu'une région, et inventer la structure
  d'un problème qu'on n'a pas coûte plus qu'elle ne rapporte.

  Ce que ce n'est pas

  Ce n'est pas un minimum par article ni par panier entier : c'est un
  minimum PAR BOUTIQUE. Un panier MACHÉ mélange les vendeurs, et chacun
  pose ses conditions ; additionner les uns avec les autres ferait
  atteindre le minimum d'un grossiste avec les achats faits ailleurs.
*/

/* Au-delà, ce n'est plus une condition de vente mais une porte fermée. */
const MAX_MINIMUM = 10_000_000;

export function readSellerMinimum(
  metadata: Record<string, unknown> | null | undefined
): number {
  const raw = (metadata ?? {})["min_order"];

  const amount = Math.floor(Number(raw));

  if (!Number.isFinite(amount) || amount <= 0) return 0;

  return Math.min(amount, MAX_MINIMUM);
}

/*
  Nettoyage de ce qu'un vendeur saisit.

  Renvoie 0 pour « pas de minimum », ce qui est le cas de la plupart des
  boutiques : la valeur par défaut d'un commerce est de vendre à qui
  veut, quelle que soit la somme.
*/
export function sanitizeMinimum(input: unknown): number {
  const amount = Math.floor(Number(String(input ?? "").replace(/[^\d]/g, "")));

  if (!Number.isFinite(amount) || amount <= 0) return 0;

  return Math.min(amount, MAX_MINIMUM);
}

export type SellerGroup = {
  sellerId: string;
  sellerName: string;
  /* Somme des lignes de cette boutique, dans la devise du panier. */
  subtotal: number;
  itemCount: number;
  minimum: number;
  /* Ce qu'il manque pour atteindre le minimum. Zéro s'il est atteint. */
  missing: number;
};

/*
  Regroupe les lignes d'un panier par boutique et confronte chaque
  groupe au minimum de sa boutique.

  `minimums` vient de l'appelant : c'est lui qui a chargé les boutiques
  concernées. Cette fonction ne fait aucun appel réseau, ce qui la rend
  vérifiable sans backend.
*/
export function groupBySeller(
  lines: {
    sellerId: string | null;
    sellerName: string | null;
    total: number;
    quantity: number;
  }[],
  minimums: Map<string, number>
): SellerGroup[] {
  const groups = new Map<string, SellerGroup>();

  for (const line of lines) {
    /*
      Une ligne sans boutique ne peut être rattachée à personne : on ne
      la range pas au hasard sous un vendeur, ce qui fausserait son
      total et donc sa condition de vente.
    */
    if (!line.sellerId) continue;

    const existing = groups.get(line.sellerId);

    if (existing) {
      existing.subtotal += line.total;
      existing.itemCount += line.quantity;
      continue;
    }

    groups.set(line.sellerId, {
      sellerId: line.sellerId,
      sellerName: line.sellerName ?? "Boutique",
      subtotal: line.total,
      itemCount: line.quantity,
      minimum: minimums.get(line.sellerId) ?? 0,
      missing: 0,
    });
  }

  for (const group of groups.values()) {
    group.missing =
      group.minimum > 0 && group.subtotal < group.minimum
        ? group.minimum - group.subtotal
        : 0;
  }

  return [...groups.values()];
}

/* Les boutiques dont le minimum n'est pas atteint. */
export function blockingGroups(groups: SellerGroup[]): SellerGroup[] {
  return groups.filter((group) => group.missing > 0);
}
