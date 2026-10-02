/*
  Les habillages saisonniers de MACHE, et la raison pour laquelle ils
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
  | "drapeau"
  | "bonne-annee"
  | "independance"
  | "carnaval"
  | "paques"
  | "ete"
  | "rentree"
  | "halloween"
  | "toussaint-gede";

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
    label: "MACHE",
    description: "L'habillage habituel : le rouge de MACHE.",
    banner: null,
    variables: {},
  },

  noel: {
    key: "noel",
    label: "Noël",
    description:
      "Vert sapin et rouge. Le rouge de MACHE devient l'accent secondaire.",
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
      "--mache-primary": "#cc1743",
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

  "bonne-annee": {
    key: "bonne-annee",
    label: "Bonne année",
    description: "Bleu nuit et or pâle, pour le passage à la nouvelle année.",
    banner: "Bonne année à tous !",
    variables: {
      "--mache-primary": "#1b2a6b",
      "--mache-primary-soft": "#e8eaf6",
      "--mache-primary-strong": "#2a3f9c",
      "--mache-primary-dark": "#111a45",
      "--mache-bg-2": "#f4f0e2",
      "--mache-line": "#e3d8b2",
    },
  },

  independance: {
    key: "independance",
    label: "Indépendance d'Haïti",
    description:
      "Bleu du drapeau et fond rosé, pour le 1er janvier (Indépendance, 1804).",
    banner: "1er janvier — Fête de l'Indépendance d'Haïti",
    variables: {
      "--mache-primary": "#0a2a8f",
      "--mache-primary-soft": "#e3e8fa",
      "--mache-primary-strong": "#1f46c9",
      "--mache-primary-dark": "#061b63",
      "--mache-bg-2": "#fbeff1",
      "--mache-line": "#ecc9cf",
    },
  },

  carnaval: {
    key: "carnaval",
    label: "Carnaval",
    description: "Orange brûlé et violet, les couleurs de la fête.",
    banner: "Bon Carnaval à tous !",
    variables: {
      "--mache-primary": "#b5420a",
      "--mache-primary-soft": "#fde9dc",
      "--mache-primary-strong": "#d95a1a",
      "--mache-primary-dark": "#7d2c05",
      "--mache-bg-2": "#f3ecf9",
      "--mache-line": "#dccbec",
    },
  },

  paques: {
    key: "paques",
    label: "Pâques",
    description: "Violet doux et jaune pâle.",
    banner: "Joyeuses Pâques",
    variables: {
      "--mache-primary": "#6d3fb2",
      "--mache-primary-soft": "#efe8fa",
      "--mache-primary-strong": "#8559cc",
      "--mache-primary-dark": "#4a2a7e",
      "--mache-bg-2": "#fbf7e4",
      "--mache-line": "#e7dfb8",
    },
  },

  ete: {
    key: "ete",
    label: "Été",
    description: "Turquoise de la mer et sable clair, pour les vacances.",
    banner: "Bel été à tous",
    variables: {
      "--mache-primary": "#00738a",
      "--mache-primary-soft": "#dff3f6",
      "--mache-primary-strong": "#0f9bb3",
      "--mache-primary-dark": "#00525f",
      "--mache-bg-2": "#fbf5e6",
      "--mache-line": "#ead9b5",
    },
  },

  rentree: {
    key: "rentree",
    label: "Rentrée des classes",
    description: "Bleu cahier et jaune crayon.",
    banner: "Bonne rentrée des classes",
    variables: {
      "--mache-primary": "#1565c0",
      "--mache-primary-soft": "#e3effb",
      "--mache-primary-strong": "#2c7fd9",
      "--mache-primary-dark": "#0d4a91",
      "--mache-bg-2": "#fff8dc",
      "--mache-line": "#eadfa6",
    },
  },

  halloween: {
    key: "halloween",
    label: "Halloween",
    description: "Orange citrouille foncé et fond crème.",
    banner: "Joyeux Halloween",
    variables: {
      "--mache-primary": "#b34700",
      "--mache-primary-soft": "#fdebdc",
      "--mache-primary-strong": "#d65f0a",
      "--mache-primary-dark": "#7a3000",
      "--mache-bg-2": "#fbf3ea",
      "--mache-line": "#ecd3b8",
    },
  },

  "toussaint-gede": {
    key: "toussaint-gede",
    label: "Toussaint et Fèt Gede",
    description:
      "Violet profond et blanc, pour le 1er et le 2 novembre. Un bandeau sobre et respectueux.",
    banner: "1er et 2 novembre — Toussaint et Fèt Gede",
    variables: {
      "--mache-primary": "#4a148c",
      "--mache-primary-soft": "#efe6f8",
      "--mache-primary-strong": "#6a2bb5",
      "--mache-primary-dark": "#32095f",
      "--mache-bg-2": "#f5f0fa",
      "--mache-line": "#d9c9ec",
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
