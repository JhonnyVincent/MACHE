/*
  RÉFÉRENCE DES CATÉGORIES MACHE

  Sert à :
  - donner un slug stable pour les URL et un libellé unique pour l'affichage ;
  - alimenter le formulaire produit, la bande de l'accueil et les filtres
    de /shop depuis une seule source.

  Pourquoi ce fichier existe :
  les catégories étaient codées en dur dans trois endroits avec trois listes
  différentes — dix valeurs dans le formulaire produit, cinq dans la bande de
  l'accueil, vingt-huit dans le menu « Plus » — sans recouvrement. Les liens
  de l'accueil passaient en plus le libellé en minuscules (`?category=mode`)
  alors que les produits stockent le libellé d'origine (« Vêtements ») : le
  filtre par catégorie ne pouvait retourner aucun résultat.

  Tous les libellés d'origine sont conservés. Le slug, lui, est ce qui
  circule dans les URL.

  La table `public.categories` (migration 0001) reprend exactement cette
  arborescence ; ce fichier reste la référence de repli quand la table est
  vide, afin que la navigation fonctionne dès le premier démarrage.
*/

/*
  L'arborescence (trois niveaux : rayon, sous-rayon, type d'article) est
  générée depuis scripts/catalogue-source.mjs : c'est ce fichier-là que
  l'on modifie, puis `node scripts/generate-categories.mjs`.
*/
import { CATEGORY_TREE } from "./categories-data";

export { CATEGORY_TREE };
export type { CategoryNode, CategoryChild } from "./categories-data";

export type FlatCategory = {
  slug: string;
  label: string;
  icon?: string;
  parentSlug?: string;
  /** 0 = rayon, 1 = sous-rayon, 2 = type d'article. */
  depth: number;
};

/** Arborescence aplatie : parents puis enfants, dans l'ordre d'affichage. */
export const ALL_CATEGORIES: FlatCategory[] = CATEGORY_TREE.flatMap((node) => [
  { slug: node.slug, label: node.label, icon: node.icon, depth: 0 },
  ...(node.children ?? []).flatMap((child) => [
    { slug: child.slug, label: child.label, parentSlug: node.slug, depth: 1 },
    ...(child.children ?? []).map((leaf) => ({
      slug: leaf.slug,
      label: leaf.label,
      parentSlug: child.slug,
      depth: 2,
    })),
  ]),
]);

const BY_SLUG = new Map(ALL_CATEGORIES.map((c) => [c.slug, c]));

/*
  Index des libellés, en casse et accents normalisés.

  Les produits déjà en base portent un libellé libre, saisi via l'ancienne
  liste du formulaire : « Vêtements », « Alimentation », « Électronique »...
  Cet index les rattache au bon slug sans avoir à migrer les données.
*/
function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const BY_LABEL = new Map<string, FlatCategory>();

for (const category of ALL_CATEGORIES) {
  BY_LABEL.set(normalize(category.label), category);
  BY_LABEL.set(normalize(category.slug), category);
}

/* Libellés hérités de l'ancienne liste du formulaire produit. */
const LEGACY_LABELS: Record<string, string> = {
  vetements: "mode",
  alimentation: "saveurs",
  electronique: "electronique",
  bijoux: "bijoux-accessoires",
  chaussures: "chaussures-femme",
  accessoires: "bijoux-accessoires",
};

for (const [label, slug] of Object.entries(LEGACY_LABELS)) {
  const target = BY_SLUG.get(slug);
  if (target) BY_LABEL.set(normalize(label), target);
}

const CHILDREN = new Map<string, FlatCategory[]>();
for (const category of ALL_CATEGORIES) {
  if (!category.parentSlug) continue;
  CHILDREN.set(category.parentSlug, [...(CHILDREN.get(category.parentSlug) ?? []), category]);
}

/** Tous les descendants d'une catégorie, enfants puis petits-enfants. */
export function descendantsOf(slug: string): FlatCategory[] {
  return (CHILDREN.get(slug) ?? []).flatMap((child) => [child, ...descendantsOf(child.slug)]);
}

/** Chemin complet d'une catégorie, du rayon au type d'article. */
export function categoryPath(slug: string): FlatCategory[] {
  const category = BY_SLUG.get(slug);
  if (!category) return [];
  return [...(category.parentSlug ? categoryPath(category.parentSlug) : []), category];
}

export function findCategory(value: string | null | undefined) {
  if (!value) return undefined;

  const raw = String(value).trim();
  return BY_SLUG.get(raw) ?? BY_LABEL.get(normalize(raw));
}

/** Libellé à afficher pour une valeur venue de la base. */
export function categoryLabel(value: string | null | undefined) {
  return findCategory(value)?.label ?? (value?.trim() || "Divers");
}

/** Slug d'URL pour une valeur venue de la base. */
export function categorySlug(value: string | null | undefined) {
  return findCategory(value)?.slug;
}

/**
 * Libellés à comparer en base pour un slug donné.
 *
 * Un filtre ne peut pas se contenter d'une égalité : la même catégorie existe
 * en base sous plusieurs écritures, et un parent doit ramener les produits de
 * ses enfants. La requête utilise donc `in (...)` sur cette liste.
 */
export function categoryMatchValues(slug: string): string[] {
  const category = BY_SLUG.get(slug);
  if (!category) return [slug];

  const values = new Set<string>([category.slug, category.label]);

  // Un parent englobe tous ses descendants.
  for (const descendant of descendantsOf(slug)) {
    values.add(descendant.slug);
    values.add(descendant.label);
  }

  // Libellés hérités pointant vers cette catégorie.
  for (const [legacy, target] of Object.entries(LEGACY_LABELS)) {
    if (target === slug) values.add(legacy);
  }

  return [...values];
}

/** Options du formulaire produit : parents et enfants, indentés. */
export const CATEGORY_OPTIONS = ALL_CATEGORIES.map((category) => ({
  value: category.label,
  slug: category.slug,
  label: category.parentSlug ? `   ${category.label}` : category.label,
  isChild: Boolean(category.parentSlug),
}));

