/*
  Les pays proposés à la commande.

  Haïti, où les boutiques livrent elles-mêmes ; puis les pays de la
  diaspora, où la commande se fait « sur confirmation » : les frais
  d'expédition et le paiement sont convenus avec MACHE avant l'envoi
  (voir backend/packages/api/src/lib/international.ts, dont la liste doit
  rester identique — un test y veille).
*/

export const HOME_COUNTRY = "ht";

export const INTERNATIONAL_COUNTRIES: Array<{ code: string; label: string }> = [
  { code: "us", label: "États-Unis" },
  { code: "ca", label: "Canada" },
  { code: "fr", label: "France" },
  { code: "gp", label: "Guadeloupe" },
  { code: "mq", label: "Martinique" },
  { code: "gf", label: "Guyane" },
  { code: "be", label: "Belgique" },
  { code: "ch", label: "Suisse" },
  { code: "do", label: "République dominicaine" },
  { code: "bs", label: "Bahamas" },
  { code: "tc", label: "Îles Turques-et-Caïques" },
  { code: "jm", label: "Jamaïque" },
  { code: "pa", label: "Panama" },
  { code: "mx", label: "Mexique" },
  { code: "cl", label: "Chili" },
  { code: "br", label: "Brésil" },
  { code: "gb", label: "Royaume-Uni" },
  { code: "de", label: "Allemagne" },
  { code: "es", label: "Espagne" },
  { code: "it", label: "Italie" },
  { code: "nl", label: "Pays-Bas" },
];

/* Le nom du mode d'expédition créé par le backend pour l'étranger. */
export const INTERNATIONAL_OPTION_NAME = "Expédition internationale — frais confirmés avant envoi";

export function isInternational(countryCode: string | null | undefined): boolean {
  const code = String(countryCode || "").trim().toLowerCase();

  return code !== "" && code !== HOME_COUNTRY;
}

export function countryLabel(code: string | null | undefined): string {
  const lower = String(code || "").toLowerCase();

  if (lower === HOME_COUNTRY) return "Haïti";

  return INTERNATIONAL_COUNTRIES.find((country) => country.code === lower)?.label ?? lower.toUpperCase();
}
