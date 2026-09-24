/*
  Les habillages saisonniers de MACHÉ, et la raison pour laquelle ils
  sont une LISTE FERMÉE.

  Pourquoi pas un choix de couleur libre

  Deux raisons, et la première n'est pas la sécurité.

  1. La lisibilité. Une couleur choisie à la main finit par être posée
     sur du texte blanc, et personne ne s'en aperçoit depuis l'écran
     d'administration — on y voit une pastille, pas une page. Un thème
     préparé a été vérifié en entier : contraste du texte sur le fond,
     des boutons, des bordures.

  2. L'injection. Ces valeurs sont recopiées dans des variables CSS
     servies à tous les visiteurs. Une chaîne libre venue d'un formulaire
     et posée dans une feuille de style est une porte ouverte ; une clé
     choisie dans une liste ne l'est pas.

  Le choix de l'administrateur se résume donc à une CLÉ. Les couleurs,
  elles, vivent ici, dans le code, relues comme du code.

  Les dates ne déclenchent rien

  Aucun thème ne s'active tout seul au 1er décembre. Un site qui change
  d'apparence sans que personne ne l'ait décidé est un site dont on ne
  sait plus qui l'a changé — et il faudrait une horloge, un fuseau, et
  une certitude sur l'année en cours. L'administrateur active, et
  désactive.
*/

export type ThemeKey =
  | "default"
  | "noel"
  | "octobre-rose"
  | "saint-valentin"
  | "drapeau";

export type Theme = {
  key: ThemeKey;
  label: string;
  /* Ce que l'administrateur lit avant de l'activer. */
  description: string;
  /* Le bandeau affiché en haut du site. Vide = aucun bandeau. */
  banner: string | null;
  /* Les variables CSS remplacées. Tout le reste garde sa valeur. */
  variables: Record<string, string>;
};

export const THEMES: Record<ThemeKey, Theme> = {
  default: {
    key: "default",
    label: "MACHÉ",
    description: "L'habillage habituel : le rouge de MACHÉ.",
    banner: null,
    variables: {},
  },

  noel: {
    key: "noel",
    label: "Noël",
    description:
      "Vert sapin et rouge. Le rouge de MACHÉ devient l'accent secondaire.",
    banner: "Joyeux Noël — bonne fête à tous",
    variables: {
      "--mache-primary": "#0f7b4b",
      "--mache-primary-soft": "#e6f4ec",
      "--mache-primary-strong": "#15945c",
      "--mache-primary-dark": "#0a5434",
      "--mache-bg-2": "#eef7f1",
      "--mache-line": "#cfe3d7",
    },
  },

  "octobre-rose": {
    key: "octobre-rose",
    label: "Octobre rose",
    description:
      "Rose de la campagne contre le cancer du sein. Un bandeau accompagne le mois.",
    banner:
      "Octobre rose — le dépistage du cancer du sein sauve des vies. Parlez-en autour de vous.",
    variables: {
      "--mache-primary": "#c2185b",
      "--mache-primary-soft": "#fce4ec",
      "--mache-primary-strong": "#e0306f",
      "--mache-primary-dark": "#8c1143",
      "--mache-bg-2": "#fdeef4",
      "--mache-line": "#f0cddc",
    },
  },

  "saint-valentin": {
    key: "saint-valentin",
    label: "Saint-Valentin",
    description: "Rouge profond et rose tendre.",
    banner: "Bonne Saint-Valentin",
    variables: {
      "--mache-primary": "#d81b4a",
      "--mache-primary-soft": "#ffe4ec",
      "--mache-primary-strong": "#ff4d7a",
      "--mache-primary-dark": "#9c0f32",
      "--mache-bg-2": "#fff0f4",
      "--mache-line": "#f4ccd8",
    },
  },

  drapeau: {
    key: "drapeau",
    label: "Fête du Drapeau",
    description:
      "Le bleu et le rouge du drapeau haïtien, pour le 18 mai et le 1er janvier.",
    banner: "18 mai — Fête du Drapeau haïtien",
    variables: {
      "--mache-primary": "#00209f",
      "--mache-primary-soft": "#e4e9fb",
      "--mache-primary-strong": "#1a3ec4",
      "--mache-primary-dark": "#001672",
      "--mache-bg-2": "#eef1fc",
      "--mache-line": "#ccd5f0",
    },
  },
};

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

/*
  Tout ce qui n'est pas une clé connue retombe sur l'habillage habituel.

  C'est le point de contrôle unique : la valeur lue en base a pu être
  écrite par une version précédente, par une main dans la console, ou
  par un thème retiré depuis. Aucune de ces situations ne doit servir
  une couleur inattendue — ni casser la page.
*/
export function themeOf(value: unknown): Theme {
  if (typeof value === "string" && (THEME_KEYS as string[]).includes(value)) {
    return THEMES[value as ThemeKey];
  }

  return THEMES.default;
}
