/*
  Mise en forme des montants.

  Ce module vit à part du catalogue, et n'importe rien.

  Ce fichier contenait auparavant `formatPrice`, qui écrivait « HTG » en
  dur. Le montant et sa devise viennent maintenant du backend, et plus
  aucun écran ne l'appelait : il est retiré plutôt que laissé en place à
  attendre qu'on s'en resserve par erreur.

  Vivre à part du catalogue est délibéré : `formatAmount` est employé par
  des composants qui tournent aussi dans le navigateur — l'éditeur visuel
  de vitrine affiche de vrais prix dans son aperçu. Tant qu'il vivait
  dans `catalog.ts`, l'importer entraînait dans le paquet du navigateur
  toute la couche d'appel à Medusa, qui n'y a rien à faire.
*/

export function formatAmount(
  amount: number | null,
  currency: string | null
): string {
  if (amount === null) return "Prix indisponible";

  /*
    La devise vient du backend : coder « HTG » en dur ici afficherait des
    gourdes sur un catalogue facturé en dollars.
  */
  const code = (currency || "HTG").toUpperCase();

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    /* Devise inconnue d'Intl : on reste lisible plutôt que d'échouer. */
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} ${code}`;
  }
}
