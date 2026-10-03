/*
  SCRIPT : les rayons de MACHE, créés au démarrage.

  Pourquoi il existe

  Le catalogue du backend ne contenait que les rayons de la
  DÉMONSTRATION Mercur — Sandals, Sneakers, Boots, Sport, Accessories
  et leurs sous-rayons, vingt en tout, en anglais. Aucun rayon de MACHE
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

export { MACHE_CATEGORY_TREE } from "./mache-categories-data";
export type { MacheCategory } from "./mache-categories-data";
import { MACHE_CATEGORY_TREE } from "./mache-categories-data";

export default async function macheCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModule = container.resolve(Modules.PRODUCT);

  type Pending = { handle: string; name: string; rank: number; parent?: string };

  // Niveau par niveau : un parent doit exister avant ses enfants.
  const levels: Pending[][] = [[], [], []];
  MACHE_CATEGORY_TREE.forEach((top, rank) => {
    levels[0].push({ handle: top.handle, name: top.name, rank });
    top.children.forEach((mid, midRank) => {
      levels[1].push({ handle: mid.handle, name: mid.name, rank: midRank, parent: top.handle });
      mid.children.forEach((leaf, leafRank) => {
        levels[2].push({ handle: leaf.handle, name: leaf.name, rank: leafRank, parent: mid.handle });
      });
    });
  });

  const handles = levels.flat().map((entry) => entry.handle);

  const existing = await productModule.listProductCategories(
    { handle: handles },
    { take: handles.length + 50 }
  );

  const byHandle = new Map(existing.map((category) => [category.handle, category]));

  let created = 0;

  for (const level of levels) {
    const missing = level.filter((entry) => !byHandle.has(entry.handle));

    // Par lots : plus de mille rayons d'un coup alourdiraient inutilement une requête.
    for (let start = 0; start < missing.length; start += 100) {
      const batch = missing.slice(start, start + 100);

      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: batch.map((entry) => ({
            name: entry.name,
            handle: entry.handle,
            is_active: true,
            rank: entry.rank,
            ...(entry.parent ? { parent_category_id: byHandle.get(entry.parent)!.id } : {}),
          })),
        },
      });

      result.forEach((category) => byHandle.set(category.handle, category));
      created += result.length;
    }
  }

  if (created > 0) {
    logger.info(
      `Rayons MACHE : ${created} rayon(s) créé(s), ${handles.length - created} déjà présent(s).`
    );
  }
}
