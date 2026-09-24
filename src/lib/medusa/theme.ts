/*
  L'habillage saisonnier du site, côté storefront.

  Où vivent les couleurs

  Dans le backend, pas ici. Ce fichier ne connaît aucune couleur : il
  reçoit celles que la route publique lui donne, et les pose telles
  quelles dans des variables CSS.

  C'est volontaire. Si le storefront gardait sa propre table de
  correspondance, ajouter un thème demanderait deux déploiements
  coordonnés — et entre les deux, une clé connue d'un côté seulement
  donnerait une page sans couleurs.

  Pourquoi on peut recopier ces valeurs dans une feuille de style

  Parce qu'elles ne viennent pas d'un formulaire. Le backend les tire
  d'une liste fermée écrite dans son code ; l'administrateur ne choisit
  qu'une clé. Le filtre ci-dessous est malgré tout appliqué : la
  confiance ne se délègue pas sur la seule foi de l'origine d'une
  réponse.

  Une panne n'éteint pas le site

  Un échec de lecture rend l'habillage habituel, sans variable ni
  bandeau. Un site qui refuserait de s'afficher parce qu'il n'a pas pu
  savoir s'il devait être vert à Noël aurait des priorités inversées.
*/

import { medusaFetch } from "./client";

export type SiteTheme = {
  key: string;
  label: string;
  banner: string | null;
  variables: Record<string, string>;
};

export const DEFAULT_THEME: SiteTheme = {
  key: "default",
  label: "MACHÉ",
  banner: null,
  variables: {},
};

/*
  Ce qu'on accepte de poser dans une feuille de style.

  Le NOM doit être une variable `--mache-*`, et la VALEUR une couleur
  hexadécimale. Tout le reste est écarté sans bruit.

  Ce filtre est la dernière barrière avant l'injection : une valeur
  comme `red; } body { display:none } .x {` refermerait la règle CSS et
  en ouvrirait une autre. Le fait que la réponse vienne de notre propre
  backend ne change rien à ce raisonnement — c'est exactement l'hypothèse
  qu'on regrette d'avoir faite le jour où elle devient fausse.
*/
const NAME = /^--mache-[a-z0-9-]+$/;
const HEX = /^#[0-9a-fA-F]{3,8}$/;

function safeVariables(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};

  const safe: Record<string, string> = {};

  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!NAME.test(name)) continue;
    if (typeof value !== "string" || !HEX.test(value)) continue;

    safe[name] = value;
  }

  return safe;
}

/*
  Le bandeau est du texte, affiché par React — donc échappé par React,
  jamais interprété comme du balisage. On borne seulement sa longueur :
  un bandeau de trois lignes repousserait le site hors de l'écran.
*/
function safeBanner(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const text = raw.trim();

  return text ? text.slice(0, 160) : null;
}

export async function fetchSiteTheme(): Promise<SiteTheme> {
  const result = await medusaFetch<{ theme?: Record<string, unknown> }>(
    "/store/site-theme",
    {},
    /*
      Cinq minutes de cache. Ce réglage change quelques fois par an ;
      le relire à chaque page servie coûterait un aller-retour au
      backend sur CHAQUE page du site, y compris l'accueil.
    */
    { revalidate: 300, tags: ["site-theme"] }
  );

  if (!result.ok || !result.data.theme) return DEFAULT_THEME;

  const theme = result.data.theme;

  return {
    key: typeof theme.key === "string" ? theme.key : "default",
    label: typeof theme.label === "string" ? theme.label : "MACHÉ",
    banner: safeBanner(theme.banner),
    variables: safeVariables(theme.variables),
  };
}

/*
  La règle CSS à poser dans la page.

  Elle cible `:root` et ne contient que des paires déjà filtrées, donc
  chaque morceau est un nom de variable et une couleur — rien qui puisse
  refermer une accolade.

  Vide quand le thème n'a pas de variable : on n'ajoute pas une balise
  `<style>` vide sur chaque page de l'année pour un thème qui ne change
  rien.
*/
export function themeStyle(theme: SiteTheme): string | null {
  const entries = Object.entries(theme.variables);

  if (entries.length === 0) return null;

  const body = entries.map(([name, value]) => `${name}:${value}`).join(";");

  return `:root{${body}}`;
}
