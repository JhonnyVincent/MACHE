/*
  LA LIVRAISON HORS D'HAÏTI : « commande sur confirmation ».

  L'objectif de MACHE est de relier Haïti au reste du monde. Aujourd'hui,
  il n'y a ni tarif de transporteur négocié (DHL ou autre), ni paiement
  en ligne. Plutôt que de fermer la porte aux acheteurs de la diaspora,
  une commande vers l'étranger se passe normalement, mais :

  - les frais d'expédition ne sont pas inventés : le mode proposé
    s'appelle « frais confirmés avant envoi », à 0 dans le panier ;
  - MACHE envoie ensuite à l'acheteur le prix de l'expédition et le
    moyen de paiement ;
  - rien n'est expédié ni payé avant son accord.

  Le jour où les tarifs d'un transporteur et un paiement en ligne sont
  branchés, ce mode est remplacé par de vrais tarifs.

  La même liste de pays vit côté site (src/lib/countries.ts) ; un test
  vérifie qu'elles restent identiques.
*/

export const HOME_COUNTRY = "ht";

/* Là où vit la diaspora haïtienne, d'abord. La liste peut s'allonger. */
export const INTERNATIONAL_COUNTRIES = [
  "us", "ca", "fr", "gp", "mq", "gf", "be", "ch", "do", "bs", "tc", "jm",
  "pa", "mx", "cl", "br", "gb", "de", "es", "it", "nl",
] as const;

export const INTERNATIONAL_ZONE_NAME = "International — sur confirmation";

export const INTERNATIONAL_OPTION_NAME = "Expédition internationale — frais confirmés avant envoi";

export const INTERNATIONAL_OPTION_CODE = "international-sur-confirmation";

export function isInternational(countryCode: string | null | undefined): boolean {
  const code = String(countryCode || "").trim().toLowerCase();

  return code !== "" && code !== HOME_COUNTRY;
}

/*
  Les pays qu'il reste à ajouter à une liste existante, sans doublon.
  Une zone ou une région se met à jour en bloc : on renvoie toujours la
  liste complète.
*/
export function withCountries(existing: string[], wanted: readonly string[]): { all: string[]; added: string[] } {
  const current = existing.map((code) => code.toLowerCase());
  const added = wanted.filter((code) => !current.includes(code));

  return { all: [...current, ...added], added };
}
