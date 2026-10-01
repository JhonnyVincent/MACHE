/*
  LES PARTENAIRES RÉELLEMENT SIGNÉS DE MACHE.

  Une seule liste, lue à la fois par la page « Partenaires » et par la
  bande de l'accueil. Deux listes auraient dérivé : un nom retiré d'un
  côté serait resté affiché de l'autre, et MACHE aurait continué à se
  réclamer d'un partenaire qui est parti.

  CE QUI A LE DROIT D'ÊTRE ÉCRIT ICI

  Uniquement quelqu'un qui a dit oui. Un nom posé sur la page d'accueil
  vaut caution : le visiteur en conclut que cette entreprise travaille
  avec MACHE. Si c'est faux, c'est un mensonge, et en droit une atteinte
  à la marque.

  La liste est volontairement pauvre : un nom, une ligne de ce qu'il
  fait, une adresse. Pas de logo qu'on n'a pas le droit d'afficher, pas
  de slogan écrit à sa place, pas de promesse de taux ou de délai que
  MACHE ne tient pas et ne vérifie pas.

  LA LIGNE QUI PROTÈGE TOUT LE MONDE

  `mediated` dit si le service passe PAR MACHE. Aujourd'hui, aucun :
  BAWON accompagne vers un financement le marchand qui le lui demande, directement,
  avec ses propres critères. MACHE ne dépose pas le dossier, ne garantit
  pas le prêt et ne touche rien dessus. Le dire évite qu'un vendeur
  croie qu'ouvrir une boutique ici lui ouvre un financement — et évite
  à MACHE de répondre d'un refus qu'elle n'a pas décidé.
*/

export type Partner = {
  name: string;
  /* Ce qu'il fait, à la troisième personne, en une phrase. */
  does: string;
  /* Son site. Rien n'est lié sans lui. */
  href?: string;
  /* Le service passe-t-il par MACHE, ou se traite-t-il en direct ? */
  mediated: boolean;
  /*
    PROFIL (facultatif). Une page `/partenaires/<slug>` n'existe que si le
    partenaire a un `slug`. Chaque champ est affiché seulement s'il est
    renseigné — et ne l'est qu'avec l'accord du partenaire : pas de logo,
    de numéro ou de réseau écrit à sa place.
  */
  slug?: string;
  /* « Financement », « Photographie »… */
  category?: string;
  /* Description plus longue que `does`, écrite avec le partenaire. */
  description?: string;
  location?: string;
  /* Chemins d'images (dans /public) fournis par le partenaire. */
  logo?: string;
  banner?: string;
  /* Contacts : numéro WhatsApp en chiffres avec indicatif (50937123456), téléphone libre. */
  whatsapp?: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
};

export function partnerBySlug(slug: string): Partner | undefined {
  return PARTNERS.find((partner) => partner.slug === slug);
}

export const PARTNERS: Partner[] = [
  {
    name: "BAWON",
    /*
      BAWON n'avance pas l'argent lui-même : il ACCOMPAGNE les marchands
      pour obtenir un financement. La première formulation lui prêtait
      un rôle de prêteur qu'il n'a pas.
    */
    does:
      "Accompagne les marchands pour obtenir un financement et acheter leur marchandise.",
    href: "https://bawon-plus-site.vercel.app/",
    mediated: false,
    slug: "bawon",
    category: "Financement",
  },
];
