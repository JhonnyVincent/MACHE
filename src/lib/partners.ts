/*
  LES PARTENAIRES RÉELLEMENT SIGNÉS DE MACHÉ.

  Une seule liste, lue à la fois par la page « Partenaires » et par la
  bande de l'accueil. Deux listes auraient dérivé : un nom retiré d'un
  côté serait resté affiché de l'autre, et MACHÉ aurait continué à se
  réclamer d'un partenaire qui est parti.

  CE QUI A LE DROIT D'ÊTRE ÉCRIT ICI

  Uniquement quelqu'un qui a dit oui. Un nom posé sur la page d'accueil
  vaut caution : le visiteur en conclut que cette entreprise travaille
  avec MACHÉ. Si c'est faux, c'est un mensonge, et en droit une atteinte
  à la marque.

  La liste est volontairement pauvre : un nom, une ligne de ce qu'il
  fait, une adresse. Pas de logo qu'on n'a pas le droit d'afficher, pas
  de slogan écrit à sa place, pas de promesse de taux ou de délai que
  MACHÉ ne tient pas et ne vérifie pas.

  LA LIGNE QUI PROTÈGE TOUT LE MONDE

  `mediated` dit si le service passe PAR MACHÉ. Aujourd'hui, aucun :
  BAWON accompagne vers un financement le marchand qui le lui demande, directement,
  avec ses propres critères. MACHÉ ne dépose pas le dossier, ne garantit
  pas le prêt et ne touche rien dessus. Le dire évite qu'un vendeur
  croie qu'ouvrir une boutique ici lui ouvre un financement — et évite
  à MACHÉ de répondre d'un refus qu'elle n'a pas décidé.
*/

export type Partner = {
  name: string;
  /* Ce qu'il fait, à la troisième personne, en une phrase. */
  does: string;
  /* Son adresse. Rien n'est affiché sans elle. */
  href: string;
  /* Le service passe-t-il par MACHÉ, ou se traite-t-il en direct ? */
  mediated: boolean;
};

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
  },
];
