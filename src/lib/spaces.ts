/*
  LES ESPACES DE MACHE, ET COMMENT ON LES NOMME.

  Pour ne pas les confondre dans le code, la documentation et entre nous :

  - « MACHE Pilote » : la gestion de la marketplace — le propriétaire et
    son équipe déléguée (panneau d'administration du backend, menu « MACHE »). Ce nom est AFFICHÉ, car ceux
    qui l'utilisent sont l'équipe.

  - « MACHE Boutik » : l'espace de chaque vendeur, grossiste ou marque
    (/dashboard/seller et le panneau vendeur du backend). Ce nom est
    INTERNE : jamais affiché. Les vendeurs voient « Espace vendeur ».

  - L'espace client : « Mon compte » (/compte, /dashboard/buyer).

  Si un texte destiné aux vendeurs ou aux clients contient « Boutik »,
  c'est une erreur : un test le vérifie.
*/

export const SPACES = {
  pilote: { code: "MACHE Pilote", shown: true, label: "MACHE Pilote" },
  boutik: { code: "MACHE Boutik", shown: false, label: "Espace vendeur" },
  client: { code: "Espace client", shown: true, label: "Mon compte" },
} as const;
