/*
  Ce que MACHÉ facture à ses vendeurs.

  Deux mécanismes, et non un seul

  La commission est prélevée sur chaque vente : le vendeur ne paie que
  s'il a vendu. C'est ce qui permet à un commerçant de Delmas d'ouvrir
  une boutique sans avancer d'argent.

  L'abonnement est un montant mensuel. Il ne concerne QUE les marques
  officielles. L'imposer à un particulier ou à une boutique de quartier
  reviendrait à leur demander de payer avant d'avoir vendu — un mur, et
  ils ne franchiraient pas la porte.

  Les grossistes ne sont ni dans l'un ni dans l'autre barème : leurs
  volumes et leurs marges ne se rangent pas dans une grille, et leur
  tarif s'arrête au cas par cas.

  Ce que ce fichier ne contient pas

  Le taux de commission. Il n'est pas encore arrêté, et l'inventer ici
  l'afficherait sur une page publique comme s'il l'était. Un vendeur qui
  lirait « 8 % » et signerait sur cette base aurait été trompé par une
  valeur que personne n'a décidée. Tant qu'il vaut `null`, les pages
  disent qu'il est en cours de fixation — ce qui est vrai.
*/

import type { SellerProfile } from "./seller-profile";

/*
  Taux de conversion retenu par MACHÉ pour l'affichage.

  Ce n'est PAS le taux du marché du jour, et la page le dit. Le montant
  dû est celui en euros ; la valeur en gourdes est là pour qu'un vendeur
  à Port-au-Prince sache de quel ordre de grandeur on parle, sans avoir
  à convertir de tête.

  Il se met à jour ici, à un seul endroit, et la date affichée change
  avec lui. Un taux figé sans date se lit comme un taux du jour.
*/
export const EUR_TO_HTG = 150;
export const EUR_TO_HTG_DATE = "22 septembre 2026";

/*
  Arrondi au millier de gourdes. Afficher « 18 037 HTG » donnerait une
  précision que le taux n'a pas : c'est une conversion indicative, pas
  une facture.
*/
export function htgFromEur(euros: number): number {
  return Math.round((euros * EUR_TO_HTG) / 1000) * 1000;
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatHtg(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount)} HTG`;
}

/*
  Les taux de commission.

  Comment ces chiffres ont été choisis

  Sur ce que pratiquent les marketplaces comparables : Etsy prélève
  6,5 %, Amazon de 8 à 15 % selon la catégorie, eBay environ 13 %, et
  les marketplaces généralistes africaines se tiennent le plus souvent
  entre 5 et 20 %. Huit pour cent place MACHÉ dans le bas de cette
  fourchette, ce qui est la position d'une plateforme qui doit encore
  convaincre des vendeurs de venir.

  Le taux réduit n'est pas une faveur. Un grossiste travaille sur des
  marges fines : huit pour cent sur du volume lui coûterait plus que sa
  marge, et il ne viendrait pas. Une marque officielle, elle, paie déjà
  un abonnement mensuel.

  CE SONT DES VALEURS DE DÉPART, à revoir. Elles vivent ici, à un seul
  endroit, et la page de tarifs les lit — changer le chiffre change la
  page.

  Ce qu'il faut savoir avant de les lire

  MACHÉ n'encaisse pas : l'acheteur paie le vendeur à la livraison. La
  commission est donc CALCULÉE et ENREGISTRÉE sur chaque commande, puis
  facturée — elle n'est pas prélevée sur un paiement qui ne passe pas
  par MACHÉ. La page le dit, sans quoi « 8 % de commission » se lirait
  comme une retenue automatique.
*/
export const COMMISSION_RATE: number | null = 8;

/*
  Le taux réduit, et à qui il s'applique. Écrit ici plutôt que dans la
  page : deux écrans qui reformulent chacun leur barème finissent par
  ne plus dire la même chose.
*/
export const COMMISSION_RATE_REDUCED = 5;

export const REDUCED_PROFILES: SellerProfile[] = ["fournisseur", "marque"];

export function commissionFor(profile: SellerProfile): number | null {
  if (COMMISSION_RATE === null) return null;

  return REDUCED_PROFILES.includes(profile)
    ? COMMISSION_RATE_REDUCED
    : COMMISSION_RATE;
}

export type Billing =
  /* Rien à payer d'avance : seule la commission s'applique. */
  | { kind: "commission" }
  /* Un montant mensuel, dans une fourchette arrêtée au cas par cas. */
  | { kind: "subscription"; minEur: number; maxEur: number }
  /* Pas de barème : le tarif se discute. */
  | { kind: "quote" };

export type Tarif = {
  profile: SellerProfile;
  title: string;
  /* À qui ça s'adresse, en une phrase qu'un vendeur reconnaît. */
  audience: string;
  billing: Billing;
  /*
    Ce que le vendeur obtient. Uniquement ce qui existe aujourd'hui :
    une ligne décrivant une fonctionnalité à venir se lit comme une
    fonctionnalité livrée.
  */
  included: string[];
  sellPage: string;
};

export const TARIFS: Tarif[] = [
  {
    profile: "particulier",
    title: "Particulier",
    audience: "Vous vendez vos propres articles, en petite quantité.",
    billing: { kind: "commission" },
    included: [
      "Boutique et catalogue",
      "Commandes et suivi de livraison",
      "Demandes de devis de vos acheteurs",
    ],
    sellPage: "/sell/particulier",
  },
  {
    profile: "business",
    title: "Business / Boutique",
    audience: "Vous tenez un commerce déclaré, avec un catalogue suivi.",
    billing: { kind: "commission" },
    included: [
      "Tout ce qui précède",
      "Plusieurs personnes dans la boutique, avec des droits distincts",
      "Vitrine personnalisable et thème de boutique",
      "Commande minimum par boutique",
    ],
    sellPage: "/sell/business",
  },
  {
    profile: "fournisseur",
    title: "Fournisseur / Grossiste",
    audience: "Vous vendez en volume à des boutiques et des revendeurs.",
    billing: { kind: "quote" },
    included: [
      "Tout ce qui précède",
      "Prix dégressifs selon la quantité",
      "Devis B2B, avec proposition et date de validité",
    ],
    sellPage: "/sell/fournisseur",
  },
  {
    profile: "marque",
    title: "Marque officielle",
    audience:
      "Vous représentez une marque et voulez une présence tenue sur MACHÉ.",
    billing: { kind: "subscription", minEur: 120, maxEur: 300 },
    included: [
      "Tout ce qui précède",
      "Boutique identifiée comme marque officielle",
    ],
    sellPage: "/sell/marque-officielle",
  },
];

/*
  La phrase qui résume le mode de facturation, pour une carte de tarif.
  Elle est écrite ici plutôt que dans la page : deux écrans qui la
  reformulent chacun de leur côté finissent par ne plus dire la même
  chose.
*/
export function billingLine(billing: Billing): string {
  switch (billing.kind) {
    case "commission":
      return "Sans abonnement";
    case "quote":
      return "Sur devis";
    case "subscription":
      return `${formatEur(billing.minEur)} à ${formatEur(billing.maxEur)} par mois`;
  }
}
