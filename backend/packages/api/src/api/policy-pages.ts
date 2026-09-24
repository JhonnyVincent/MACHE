/*
  Les pages du site dont le texte se gère depuis l'administration.

  Pourquoi une liste fermée

  Parce que chaque entrée correspond à une page qui existe dans le
  site. Laisser créer un slug libre produirait des textes soigneusement
  rédigés que personne ne verrait jamais — écrits, publiés, et affichés
  nulle part.

  Ajouter une page demande donc deux choses : une ligne ici, et une
  page qui la lit. C'est voulu : le second point est celui qu'on
  oublie.
*/

export const POLICY_PAGES = {
  confidentialite: {
    label: "Confidentialité",
    path: "/legal/privacy",
    hint: "Quelles données MACHÉ collecte, pourquoi, et ce qu'il en fait.",
  },
  conditions: {
    label: "Conditions générales",
    path: "/legal/terms",
    hint: "Les règles d'usage du site, pour les acheteurs comme pour les vendeurs.",
  },
  retours: {
    label: "Retours et remboursements",
    path: "/legal/returns",
    hint: "Ce qu'un acheteur peut renvoyer, dans quel délai, et à qui.",
  },
  livraison: {
    label: "Livraison",
    path: "/legal/shipping",
    hint: "Les quatre chemins d'un colis, et le code de remise.",
  },
  vendeurs: {
    label: "Conditions vendeurs",
    path: "/legal/vendors",
    hint: "Ce qu'un vendeur accepte en ouvrant une boutique.",
  },
} as const;

export type PolicySlug = keyof typeof POLICY_PAGES;

export const POLICY_SLUGS = Object.keys(POLICY_PAGES) as PolicySlug[];

export function isPolicySlug(value: unknown): value is PolicySlug {
  return typeof value === "string" && (POLICY_SLUGS as string[]).includes(value);
}
