/*
  RÉFÉRENCE DES CATÉGORIES MACHÉ

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

export type CategoryNode = {
  slug: string;
  label: string;
  icon?: string;
  /** Sous-catégories, dans l'ordre d'affichage. */
  children?: { slug: string; label: string }[];
};

/*
  Les six premières entrées sont celles de la bande de l'accueil : elles
  portent l'identité visuelle du site et gardent leur émoji.
*/
export const CATEGORY_TREE: CategoryNode[] = [
  {
    slug: "mode",
    label: "Mode",
    icon: "👕",
    children: [
      { slug: "vetements-femme", label: "Vêtements femme" },
      { slug: "vetements-homme", label: "Vêtements homme" },
      { slug: "mode-enfant", label: "Mode enfant" },
      { slug: "chaussures-femme", label: "Chaussures femme" },
      { slug: "chaussures-homme", label: "Chaussures homme" },
      { slug: "chaussures-enfant", label: "Chaussures enfant" },
      { slug: "lingerie-pyjamas", label: "Lingerie et pyjamas" },
      { slug: "sacs-bagages", label: "Sacs et bagages" },
      { slug: "bijoux-accessoires", label: "Bijoux et accessoires" },
    ],
  },
  {
    slug: "beaute",
    label: "Beauté",
    icon: "🌺",
    children: [{ slug: "beaute-sante", label: "Beauté et santé" }],
  },
  {
    slug: "maison",
    label: "Maison",
    icon: "🏠",
    children: [
      { slug: "maison-cuisine", label: "Maison et cuisine" },
      { slug: "meubles", label: "Meubles" },
      { slug: "electromenagers", label: "Électroménagers" },
      { slug: "outillage-habitat", label: "Outillage et amélioration de l'habitat" },
    ],
  },
  {
    slug: "saveurs",
    label: "Saveurs",
    icon: "🍲",
    children: [{ slug: "alimentation-epicerie", label: "Alimentation et épicerie" }],
  },
  {
    slug: "artisanat",
    label: "Artisanat",
    icon: "🎨",
    children: [{ slug: "arts-artisanat-couture", label: "Arts, artisanat et couture" }],
  },
  {
    slug: "electronique",
    label: "Électronique",
    icon: "📱",
    children: [
      { slug: "telephones-accessoires", label: "Téléphones et accessoires" },
      { slug: "electroniques", label: "Électroniques" },
    ],
  },
  {
    slug: "loisirs",
    label: "Loisirs",
    icon: "🎲",
    children: [
      { slug: "jouets-jeux", label: "Jouets et jeux" },
      { slug: "sports-plein-air", label: "Sports et activités d'extérieur" },
      { slug: "livres-medias", label: "Livres et médias" },
    ],
  },
  {
    slug: "bebe",
    label: "Bébé",
    icon: "🍼",
    children: [{ slug: "bebe-maternite", label: "Bébé et maternité" }],
  },
  { slug: "automobile", label: "Automobile", icon: "🚗" },
  { slug: "animaux", label: "Animaux", icon: "🐾", children: [{ slug: "accessoires-animaux", label: "Accessoires animaux" }] },
  { slug: "bureau-scolaire", label: "Bureau et scolaire", icon: "✏️" },
  { slug: "services", label: "Services", icon: "🛠️" },
];

/** Les catégories mises en avant dans la bande de l'accueil. */
export const FEATURED_CATEGORY_SLUGS = [
  "artisanat",
  "beaute",
  "maison",
  "mode",
  "saveurs",
] as const;

export type FlatCategory = {
  slug: string;
  label: string;
  icon?: string;
  parentSlug?: string;
};

/** Arborescence aplatie : parents puis enfants, dans l'ordre d'affichage. */
export const ALL_CATEGORIES: FlatCategory[] = CATEGORY_TREE.flatMap((node) => [
  { slug: node.slug, label: node.label, icon: node.icon },
  ...(node.children ?? []).map((child) => ({
    slug: child.slug,
    label: child.label,
    parentSlug: node.slug,
  })),
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

  // Un parent englobe ses enfants.
  const node = CATEGORY_TREE.find((n) => n.slug === slug);
  for (const child of node?.children ?? []) {
    values.add(child.slug);
    values.add(child.label);
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

export const FEATURED_CATEGORIES = FEATURED_CATEGORY_SLUGS.map(
  (slug) => BY_SLUG.get(slug)!
).filter(Boolean);
