/*
  SCRIPT : les rayons de MACHÉ, créés au démarrage.

  Pourquoi il existe

  Le catalogue du backend ne contenait que les rayons de la
  DÉMONSTRATION Mercur — Sandals, Sneakers, Boots, Sport, Accessories
  et leurs sous-rayons, vingt en tout, en anglais. Aucun rayon de MACHÉ
  n'y existait : ni Mode, ni Saveurs, ni les trois ajoutés depuis —
  Fait à la main, Fait maison, Bio et naturel. Le site en avait la
  liste ; le backend, qui range réellement les produits, ne l'avait pas.
  Un vendeur ne pouvait donc classer son article nulle part ailleurs
  que dans des rayons de chaussures fictives.

  Et les créer demandait d'ouvrir l'administration Medusa — que l'on
  n'a pas toujours sous la main. Ils sont donc créés ici, à chaque
  démarrage, sans rien à faire.

  Ce qu'il ne fait JAMAIS

  - Il ne supprime rien : les rayons de démonstration restent. Les
    retirer est une décision, pas une mise en place.
  - Il ne renomme ni ne déplace un rayon existant : si quelqu'un en a
    changé le nom depuis l'administration, ce choix est respecté.
  Il ne fait qu'AJOUTER ce qui manque, reconnu par son identifiant
  d'adresse (`handle`) — le même que celui des liens du site.

  UNE LISTE RECOPIÉE, ET CE QUI L'EMPÊCHE DE DÉRIVER

  La référence est src/lib/categories.ts, côté site. Le backend ne peut
  pas l'importer (il est construit et déployé à part), elle est donc
  recopiée ci-dessous — et tests/rayons-backend.test.mts échoue dès
  que les deux divergent d'un identifiant ou d'un nom. Ajouter un rayon
  se fait aux deux endroits, et le test rappelle le second.
*/

import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/core-flows";

export type MacheCategory = {
  handle: string;
  name: string;
  children: { handle: string; name: string }[];
};

export const MACHE_CATEGORY_TREE: MacheCategory[] = [
  {
    handle: "mode",
    name: "Mode",
    children: [
      { handle: "vetements-femme", name: "Vêtements femme" },
      { handle: "vetements-homme", name: "Vêtements homme" },
      { handle: "mode-enfant", name: "Mode enfant" },
      { handle: "chaussures-femme", name: "Chaussures femme" },
      { handle: "chaussures-homme", name: "Chaussures homme" },
      { handle: "chaussures-enfant", name: "Chaussures enfant" },
      { handle: "lingerie-pyjamas", name: "Lingerie et pyjamas" },
      { handle: "sacs-bagages", name: "Sacs et bagages" },
      { handle: "bijoux-accessoires", name: "Bijoux et accessoires" },
    ],
  },
  {
    handle: "beaute",
    name: "Beauté",
    children: [
      { handle: "beaute-sante", name: "Beauté et santé" },
    ],
  },
  {
    handle: "maison",
    name: "Maison",
    children: [
      { handle: "maison-cuisine", name: "Maison et cuisine" },
      { handle: "meubles", name: "Meubles" },
      { handle: "electromenagers", name: "Électroménagers" },
      { handle: "outillage-habitat", name: "Outillage et amélioration de l'habitat" },
    ],
  },
  {
    handle: "saveurs",
    name: "Saveurs",
    children: [
      { handle: "alimentation-epicerie", name: "Alimentation et épicerie" },
    ],
  },
  {
    handle: "artisanat",
    name: "Artisanat",
    children: [
      { handle: "arts-artisanat-couture", name: "Arts, artisanat et couture" },
    ],
  },
  {
    handle: "fait-a-la-main",
    name: "Fait à la main",
    children: [
      { handle: "crochet-tricot", name: "Crochet et tricot" },
      { handle: "tableaux-peintures", name: "Tableaux et peintures" },
      { handle: "vannerie-paille", name: "Vannerie et paille" },
      { handle: "bois-sculpture", name: "Bois et sculpture" },
      { handle: "couture-brodee", name: "Couture et broderie" },
      { handle: "bijoux-faits-main", name: "Bijoux faits main" },
    ],
  },
  {
    handle: "fait-maison",
    name: "Fait maison",
    children: [
      { handle: "confitures-conserves", name: "Confitures et conserves" },
      { handle: "patisserie-maison", name: "Pâtisserie maison" },
      { handle: "epices-sauces", name: "Épices et sauces" },
      { handle: "boissons-maison", name: "Boissons maison" },
      { handle: "savons-cosmetiques-maison", name: "Savons et cosmétiques maison" },
    ],
  },
  {
    handle: "bio",
    name: "Bio et naturel",
    children: [
      { handle: "produits-bio", name: "Produits bio" },
      { handle: "huiles-essentielles", name: "Huiles et plantes" },
      { handle: "soins-naturels", name: "Soins naturels" },
    ],
  },
  {
    handle: "electronique",
    name: "Électronique",
    children: [
      { handle: "telephones-accessoires", name: "Téléphones et accessoires" },
      { handle: "electroniques", name: "Électroniques" },
    ],
  },
  {
    handle: "loisirs",
    name: "Loisirs",
    children: [
      { handle: "jouets-jeux", name: "Jouets et jeux" },
      { handle: "sports-plein-air", name: "Sports et activités d'extérieur" },
      { handle: "livres-medias", name: "Livres et médias" },
    ],
  },
  {
    handle: "bebe",
    name: "Bébé",
    children: [
      { handle: "bebe-maternite", name: "Bébé et maternité" },
    ],
  },
  {
    handle: "automobile",
    name: "Automobile",
    children: [],
  },
  {
    handle: "animaux",
    name: "Animaux",
    children: [
      { handle: "accessoires-animaux", name: "Accessoires animaux" },
    ],
  },
  {
    handle: "bureau-scolaire",
    name: "Bureau et scolaire",
    children: [],
  },
  {
    handle: "services",
    name: "Services",
    children: [],
  },
];

export default async function macheCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModule = container.resolve(Modules.PRODUCT);

  const handles = MACHE_CATEGORY_TREE.flatMap((parent) => [
    parent.handle,
    ...parent.children.map((child) => child.handle),
  ]);

  const existing = await productModule.listProductCategories(
    { handle: handles },
    { take: handles.length + 10 }
  );

  const byHandle = new Map(existing.map((category) => [category.handle, category]));

  let created = 0;

  const missingParents = MACHE_CATEGORY_TREE
    .map((parent, rank) => ({ parent, rank }))
    .filter(({ parent }) => !byHandle.has(parent.handle));

  if (missingParents.length > 0) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingParents.map(({ parent, rank }) => ({
          name: parent.name,
          handle: parent.handle,
          is_active: true,
          rank,
        })),
      },
    });

    result.forEach((category) => byHandle.set(category.handle, category));
    created += result.length;
  }

  const missingChildren = MACHE_CATEGORY_TREE.flatMap((parent) =>
    parent.children
      .map((child, rank) => ({ child, rank, parent }))
      .filter(({ child }) => !byHandle.has(child.handle))
  );

  if (missingChildren.length > 0) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingChildren.map(({ child, rank, parent }) => ({
          name: child.name,
          handle: child.handle,
          is_active: true,
          rank,
          parent_category_id: byHandle.get(parent.handle)!.id,
        })),
      },
    });

    created += result.length;
  }

  if (created > 0) {
    logger.info(
      `Rayons MACHÉ : ${created} rayon(s) créé(s), ${handles.length - created} déjà présent(s).`
    );
  }
}
