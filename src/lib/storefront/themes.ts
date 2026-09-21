/*
  Les thèmes de vitrine.

  Ce qu'un thème change, et ce qu'il ne change pas

  Uniquement la famille de couleurs d'accent : les boutons, le bandeau
  d'annonce, le fond du bandeau principal. Le fond de page, la couleur
  du texte et les bordures restent ceux de MACHÉ.

  Ce n'est pas une limitation technique mais un choix. Une boutique doit
  rester reconnaissable comme une boutique MACHÉ — un client qui passe
  d'une vitrine à l'autre ne doit pas avoir l'impression de changer de
  site. Et surtout : laisser choisir le fond ET le texte, c'est laisser
  produire du jaune sur blanc.

  Pourquoi une liste fermée plutôt qu'un sélecteur de couleur

  Un sélecteur libre produit des vitrines illisibles. Ce n'est pas une
  hypothèse : les contrastes de chaque thème sont calculés et vérifiés
  (`npm run test:themes`), et deux candidats ont été écartés pour cette
  raison — un ambre à 2,56 sur blanc, inutilisable, et le rouge MACHÉ
  lui-même, à 4,46, qui passait juste sous le seuil et a dû être
  assombri de deux pour cent.

  Le seuil retenu est celui du niveau AA des règles d'accessibilité du
  web : 4,5 pour du texte normal. Un vendeur ne peut donc pas produire
  une vitrine que ses clients ne pourront pas lire.
*/

export type StorefrontTheme = {
  id: string;
  /* Le nom que voit le vendeur. */
  label: string;
  /* Ce que le thème évoque, pour aider à choisir. */
  hint: string;
  /* Boutons et accents. Du texte blanc se pose dessus. */
  primary: string;
  /* Fond des bandeaux d'annonce. */
  soft: string;
  /* Texte posé sur `soft`. */
  dark: string;
  /* Survol des boutons. */
  strong: string;
  /* Fond du bandeau principal. Du texte blanc se pose dessus. */
  hero: string;
};

export const STOREFRONT_THEMES: StorefrontTheme[] = [
  {
    id: "hibiscus",
    label: "Hibiscus",
    hint: "Le rouge de MACHÉ.",
    /*
      #e91e3a, la teinte d'origine, donne 4,46 sur blanc — sous le seuil
      de lisibilité. Deux pour cent plus sombre suffit à passer, et la
      différence ne se voit pas.
    */
    primary: "#e41d39",
    soft: "#ffe8ee",
    dark: "#9f1024",
    strong: "#ff3f61",
    hero: "#101820",
  },
  {
    id: "ocean",
    label: "Océan",
    hint: "Bleu marin, calme et net.",
    primary: "#0f6fa8",
    soft: "#e7f2f9",
    dark: "#0a4b73",
    strong: "#1a86c7",
    hero: "#0b2233",
  },
  {
    id: "vetiver",
    label: "Vétiver",
    hint: "Vert végétal, pour l'agricole et l'artisanal.",
    primary: "#2e7d4f",
    soft: "#e8f5ee",
    dark: "#1d5434",
    strong: "#3a9a62",
    hero: "#12251a",
  },
  {
    id: "cacao",
    label: "Cacao",
    hint: "Brun chaud, pour l'épicerie et le terroir.",
    primary: "#8a5a2b",
    soft: "#f7efe6",
    dark: "#5e3c1b",
    strong: "#a66f38",
    hero: "#241a11",
  },
  {
    id: "indigo",
    label: "Indigo",
    hint: "Bleu profond, pour la mode et le textile.",
    primary: "#4a3f9e",
    soft: "#eeecfa",
    dark: "#332b70",
    strong: "#5c4fc0",
    hero: "#191633",
  },
  {
    id: "corail",
    label: "Corail",
    hint: "Orange soutenu, vif sans être criard.",
    primary: "#c2410c",
    soft: "#fdeee5",
    dark: "#8a2c06",
    strong: "#e04f0f",
    hero: "#2a1409",
  },
  {
    id: "aubergine",
    label: "Aubergine",
    hint: "Violet sombre, pour la beauté et le soin.",
    primary: "#7b2d6b",
    soft: "#f7e9f4",
    dark: "#551e49",
    strong: "#963783",
    hero: "#241021",
  },
];

export const DEFAULT_THEME = STOREFRONT_THEMES[0];

export function themeById(id: string): StorefrontTheme {
  return STOREFRONT_THEMES.find((theme) => theme.id === id) ?? DEFAULT_THEME;
}

export function isThemeId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    STOREFRONT_THEMES.some((theme) => theme.id === value)
  );
}

/*
  Le thème choisi par une boutique.

  Renvoie celui de MACHÉ quand rien n'est choisi : contrairement au
  profil, une vitrine doit avoir des couleurs. Il n'y a pas d'état
  « sans thème ».
*/
export function readSellerTheme(
  metadata: Record<string, unknown> | null | undefined
): StorefrontTheme {
  const raw = (metadata ?? {})["theme"];

  return isThemeId(raw) ? themeById(raw) : DEFAULT_THEME;
}

/*
  Les variables CSS à poser sur la vitrine.

  On ne redéfinit que ce que le thème couvre. Le reste — fond, texte,
  bordures — est hérité du site, et c'est ce qui fait qu'une boutique
  reste une boutique MACHÉ.
*/
export function themeStyle(theme: StorefrontTheme): Record<string, string> {
  return {
    "--mache-primary": theme.primary,
    "--mache-primary-soft": theme.soft,
    "--mache-primary-dark": theme.dark,
    "--mache-primary-strong": theme.strong,
    "--mache-dark": theme.hero,
  };
}
